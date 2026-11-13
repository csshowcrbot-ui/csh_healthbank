import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';

const router = express.Router();

// GET /api/v1/redemption/catalog - Return active catalog items from persistent store
router.get('/catalog', (req, res) => {
  const items = (db.data.catalog_items || []).filter(item => item.is_active !== false);
  return res.json({
    code: 200,
    message: 'success',
    data: items
  });
});

// POST /api/v1/redemption/charity-donate
router.post('/charity-donate', (req, res) => {
  try {
    const { project_code = 'QIAN_SHAN_2026', points_to_donate = 100 } = req.body;
    const user = db.getUser(req.user?.id);

    const pointsNum = Number(points_to_donate);
    if (pointsNum <= 0 || pointsNum % 100 !== 0) {
      return res.status(400).json({
        code: 400,
        message: '前山基金會專案每次捐贈需以 100 點為單位'
      });
    }

    const currentBalance = db.getUserBalance(user.id);
    if (currentBalance < pointsNum) {
      return res.status(400).json({
        code: 400,
        message: `點數餘額不足！目前餘額：${currentBalance} pt，需要：${pointsNum} pt`
      });
    }

    // Matching ratio: 100 points -> NT$ 200
    const matchingRatio = 2; // NT$ 2 per point
    const matchingFund = pointsNum * matchingRatio;
    const txDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const transactionId = `TX-${txDate}-${randomSuffix}`;
    const idempotencyKey = `CHARITY-${user.id}-${Date.now()}`;

    // Double-entry point ledger
    const { newBalance } = db.addLedgerEntry({
      userId: user.id,
      transactionType: 'CHARITY_DONATE',
      points: -pointsNum,
      idempotencyKey,
      sourceRefId: transactionId,
      notes: `南投縣私立前山社會福利慈善事業基金會 愛心加成捐贈 (醫院加碼代捐 NT$ ${matchingFund} 元)`
    });

    // Save redemption
    const redemptionRecord = {
      id: uuidv4(),
      user_id: user.id,
      type: 'CHARITY_DONATION',
      item_name: '前山基金會・弱勢關懷加成捐贈',
      deducted_points: pointsNum,
      actual_cash_value: matchingFund,
      qr_voucher_code: transactionId,
      status: 'DONATED',
      used_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      metadata: {
        beneficiary: '財團法人南投縣私立前山社會福利慈善事業基金會',
        project_code,
        matching_fund: matchingFund,
        donor_name: user.name,
        employee_no: user.employee_no
      }
    };

    db.data.redemptions.push(redemptionRecord);
    db.save();

    // Push notification
    db.addNotification({
      title: '喜捨成蔭・前山善行結善緣',
      message: `感謝您呈獻 ${pointsNum} pt！竹山秀傳已為您加碼代捐 NT$ ${matchingFund} 元予前山基金會。`,
      type: 'charity'
    });

    return res.json({
      code: 200,
      message: '愛心捐贈轉換完成，感謝同仁善行',
      data: {
        transaction_id: transactionId,
        donated_points: pointsNum,
        hospital_matching_fund: matchingFund,
        beneficiary: '財團法人南投縣私立前山社會福利慈善事業基金會',
        current_balance: newBalance,
        certificate_badge_url: 'https://assets.csh.org.tw/badges/angel_tree_2026.svg',
        created_at: redemptionRecord.created_at
      }
    });
  } catch (err) {
    return res.status(400).json({ code: 400, message: err.message });
  }
});

// POST /api/v1/redemption/coupon
router.post('/coupon', (req, res) => {
  try {
    const { item_id } = req.body;
    const user = db.getUser(req.user?.id);
    const item = (db.data.catalog_items || []).find(c => c.id === item_id);

    if (!item || item.is_active === false) {
      return res.status(404).json({ code: 404, message: '找不到此兌換項目或該好物已下架' });
    }

    if (typeof item.stock === 'number' && item.stock <= 0) {
      return res.status(400).json({ code: 400, message: `「${item.name}」目前已兌換完畢（庫存為 0）` });
    }

    const currentBalance = db.getUserBalance(user.id);
    if (currentBalance < item.points) {
      return res.status(400).json({
        code: 400,
        message: `點數餘額不足！目前餘額：${currentBalance} pt，需要：${item.points} pt`
      });
    }

    const voucherCode = `CSH-VOUCHER-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const idempotencyKey = `COUPON-${user.id}-${voucherCode}`;

    // Deduct points
    const { newBalance } = db.addLedgerEntry({
      userId: user.id,
      transactionType: 'REDEEM_COUPON',
      points: -item.points,
      idempotencyKey,
      sourceRefId: voucherCode,
      notes: `生活禮遇兌換：${item.name}`
    });

    if (typeof item.stock === 'number') {
      item.stock = Math.max(0, item.stock - 1);
      item.updated_at = new Date().toISOString();
    }

    const voucher = {
      id: uuidv4(),
      user_id: user.id,
      type: 'INTERNAL_VOUCHER',
      item_id: item.id,
      item_name: item.name,
      deducted_points: item.points,
      actual_cash_value: item.cashValue,
      qr_voucher_code: voucherCode,
      status: 'ACTIVE',
      used_at: null,
      created_at: new Date().toISOString(),
      metadata: {
        category: item.category,
        description: item.description
      }
    };

    db.data.redemptions.push(voucher);
    db.save();

    db.addNotification({
      title: '生活禮遇・兌換完成',
      message: `您已成功換取「${item.name}」，已生成專屬電子票券。`,
      type: 'success'
    });

    return res.json({
      code: 200,
      message: '兌換券發行成功',
      data: {
        voucher,
        current_balance: newBalance
      }
    });
  } catch (err) {
    return res.status(400).json({ code: 400, message: err.message });
  }
});

// GET /api/v1/redemption/my-coupons
router.get('/my-coupons', (req, res) => {
  try {
    const user = db.getUser(req.user?.id);
    const records = db.data.redemptions
      .filter(r => r.user_id === user.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json({
      code: 200,
      message: 'success',
      data: records
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// POST /api/v1/redemption/verify-coupon (Simulate scanning QR code by canteen / HR)
router.post('/verify-coupon', (req, res) => {
  try {
    const { qr_voucher_code } = req.body;
    const voucher = db.data.redemptions.find(v => v.qr_voucher_code === qr_voucher_code);

    if (!voucher) {
      return res.status(404).json({ code: 404, message: '查無此兌換憑證或條碼無效' });
    }

    if (voucher.status === 'USED') {
      return res.status(400).json({
        code: 400,
        message: `此票券已於 ${new Date(voucher.used_at).toLocaleString('zh-TW')} 核銷使用，不可重複兌換`
      });
    }

    if (voucher.status !== 'ACTIVE') {
      return res.status(400).json({
        code: 400,
        message: `票券狀態異常 (${voucher.status})`
      });
    }

    voucher.status = 'USED';
    voucher.used_at = new Date().toISOString();
    db.save();

    db.addNotification({
      title: '票券核銷成功',
      message: `您的「${voucher.item_name}」已於餐檯/窗口完成核銷折抵。`,
      type: 'info'
    });

    return res.json({
      code: 200,
      message: '票券核銷成功！折抵完成',
      data: voucher
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

export default router;

