import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db, { getTreeLevelInfo } from '../db.js';
import { sanitizeUser, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const ALLOWED_ROLES = ['STAFF', 'ADMIN'];
const ALLOWED_SPORT_CATEGORIES = ['CARDIO', 'STRENGTH', 'FLEXIBILITY', 'GROUP'];
const ALLOWED_SPORT_USAGE_MODES = ['MULTI', 'SINGLE'];
const ALLOWED_HABIT_KEYS = ['VEGETARIAN', 'EDUCATION', 'CHECKUP', 'GYM', 'CUSTOM'];

// All admin operations strictly require ADMIN role
router.use(requireAdmin);

function getActorLabel(req) {
  if (req.user) {
    return `${req.user.name} (${req.user.employee_no})`;
  }
  return 'SYSTEM_ADMIN';
}

// GET /api/v1/admin/overview - Platform KPIs and summary
router.get('/overview', (req, res) => {
  try {
    const users = db.data.users || [];
    const activeUsers = users.filter(u => u.is_active);
    const totalPointsCirculation = users.reduce((sum, u) => sum + db.getUserBalance(u.id), 0);

    const catalogItems = db.data.catalog_items || [];
    const activeCatalogCount = catalogItems.filter(c => c.is_active !== false).length;

    const sportItems = db.data.sport_items || [];
    const activeSportCount = sportItems.filter(s => s.is_active !== false).length;

    const habitTasks = db.data.habit_tasks || [];
    const activeHabitTaskCount = habitTasks.filter(t => t.is_active !== false).length;

    const redemptions = db.data.redemptions || [];
    const voucherRedemptions = redemptions.filter(r => r.type === 'INTERNAL_VOUCHER');
    const activeVouchers = voucherRedemptions.filter(r => r.status === 'ACTIVE').length;
    const usedVouchers = voucherRedemptions.filter(r => r.status === 'USED').length;

    const charityDonations = redemptions.filter(r => r.type === 'CHARITY_DONATION');
    const totalCharityPoints = charityDonations.reduce((sum, r) => sum + r.deducted_points, 0);
    const totalCharityCash = charityDonations.reduce((sum, r) => sum + Number(r.actual_cash_value || 0), 0);

    return res.json({
      code: 200,
      message: 'success',
      data: {
        users: {
          total: users.length,
          active: activeUsers.length
        },
        points: {
          total_circulation: totalPointsCirculation
        },
        catalog: {
          total: catalogItems.length,
          active: activeCatalogCount
        },
        sports: {
          total: sportItems.length,
          active: activeSportCount
        },
        habit_tasks: {
          total: habitTasks.length,
          active: activeHabitTaskCount
        },
        vouchers: {
          total: voucherRedemptions.length,
          active: activeVouchers,
          used: usedVouchers
        },
        charity: {
          count: charityDonations.length,
          total_points: totalCharityPoints,
          total_matching_ntd: totalCharityCash
        },
        recent_audits: (db.data.audit_logs || []).slice(0, 8)
      }
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// ==================== 1. 會員管理 (Member Management) ====================

// GET /api/v1/admin/users
router.get('/users', (req, res) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    const list = (db.data.users || [])
      .filter(u => {
        if (!q) return true;
        return (
          u.employee_no.toLowerCase().includes(q) ||
          u.name.toLowerCase().includes(q) ||
          u.dept_code.toLowerCase().includes(q) ||
          (u.card_uid || '').toLowerCase().includes(q)
        );
      })
      .map(u => {
        const tree = db.getTreeStatus(u.id);
        const levelInfo = getTreeLevelInfo(tree.total_exp);
        const redemptionsCount = (db.data.redemptions || []).filter(r => r.user_id === u.id).length;
        return {
          ...sanitizeUser(u),
          current_balance: db.getUserBalance(u.id),
          tree: {
            level: levelInfo.level,
            level_name: levelInfo.levelName,
            total_exp: tree.total_exp,
            pending_dew: tree.pending_dew
          },
          redemptions_count: redemptionsCount
        };
      });

    return res.json({ code: 200, message: 'success', data: list });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// POST /api/v1/admin/users - Create new member
router.post('/users', (req, res) => {
  try {
    const {
      employee_no,
      name,
      dept_code,
      card_uid,
      line_user_id,
      role = 'STAFF',
      password,
      initial_points = 0
    } = req.body || {};

    if (!employee_no || !name || !dept_code) {
      return res.status(400).json({ code: 400, message: '員工工號、姓名與部門代碼為必填欄位' });
    }

    const normalizedEmpNo = String(employee_no).trim().toUpperCase();
    if (db.data.users.some(u => u.employee_no.toUpperCase() === normalizedEmpNo)) {
      return res.status(409).json({ code: 409, message: `員工工號 ${normalizedEmpNo} 已存在` });
    }

    const normalizedCardUid = card_uid ? String(card_uid).trim() : null;
    if (normalizedCardUid && db.data.users.some(u => u.card_uid === normalizedCardUid)) {
      return res.status(409).json({ code: 409, message: `識別證卡號 ${normalizedCardUid} 已被其他同仁使用` });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ code: 400, message: '系統角色僅允許 STAFF 或 ADMIN' });
    }

    const now = new Date().toISOString();
    const newUser = {
      id: uuidv4(),
      employee_no: normalizedEmpNo,
      line_user_id: line_user_id ? String(line_user_id).trim() : null,
      card_uid: normalizedCardUid,
      name: String(name).trim(),
      dept_code: String(dept_code).trim(),
      role,
      password: password ? String(password) : 'csh1234',
      is_active: true,
      created_at: now,
      updated_at: now
    };

    db.data.users.push(newUser);
    db.getTreeStatus(newUser.id);

    const initPts = Number(initial_points) || 0;
    if (initPts > 0) {
      db.addLedgerEntry({
        userId: newUser.id,
        transactionType: 'INITIAL_GRANT',
        points: initPts,
        idempotencyKey: `ADMIN-INIT-${newUser.id}-${Date.now()}`,
        sourceRefId: 'ADMIN-CREATE-USER',
        notes: '後台建立會員初始點數入帳'
      });
    } else {
      db.save();
    }

    db.addAuditLog({
      actor: getActorLabel(req),
      action: 'CREATE_USER',
      targetType: 'USER',
      targetId: newUser.employee_no,
      reason: `新增員工 ${newUser.name} (${newUser.dept_code})`,
      beforeVal: null,
      afterVal: { employee_no: newUser.employee_no, role: newUser.role, initial_points: initPts }
    });

    return res.status(201).json({
      code: 200,
      message: `已新增會員 ${newUser.name} (${newUser.employee_no})`,
      data: sanitizeUser(newUser)
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// PATCH /api/v1/admin/users/:id - Update member info / role / active status
router.patch('/users/:id', (req, res) => {
  try {
    const user = db.data.users.find(u => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ code: 404, message: '找不到該會員資料' });
    }

    const beforeVal = {
      name: user.name,
      dept_code: user.dept_code,
      card_uid: user.card_uid,
      line_user_id: user.line_user_id,
      role: user.role,
      is_active: user.is_active
    };

    const { name, dept_code, card_uid, line_user_id, role, is_active, password } = req.body || {};

    if (req.user && req.user.id === user.id) {
      if (is_active === false || (role !== undefined && role !== 'ADMIN')) {
        return res.status(400).json({
          code: 400,
          message: '為確保系統管理運作，無法停用或降級目前登入中的系統管理員帳號'
        });
      }
    }

    if (role !== undefined && !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        code: 400,
        message: '系統角色僅允許 STAFF 或 ADMIN'
      });
    }

    if (card_uid !== undefined) {
      const trimmedCard = card_uid ? String(card_uid).trim() : null;
      if (trimmedCard && db.data.users.some(u => u.id !== user.id && u.card_uid === trimmedCard)) {
        return res.status(409).json({ code: 409, message: `識別證卡號 ${trimmedCard} 已被使用` });
      }
      user.card_uid = trimmedCard;
    }

    if (name !== undefined && String(name).trim()) user.name = String(name).trim();
    if (dept_code !== undefined && String(dept_code).trim()) user.dept_code = String(dept_code).trim();
    if (line_user_id !== undefined) user.line_user_id = line_user_id ? String(line_user_id).trim() : null;
    if (role !== undefined && ALLOWED_ROLES.includes(role)) user.role = role;
    if (typeof is_active === 'boolean') user.is_active = is_active;
    if (password && String(password).trim()) user.password = String(password).trim();

    user.updated_at = new Date().toISOString();
    db.save();

    const afterVal = {
      name: user.name,
      dept_code: user.dept_code,
      card_uid: user.card_uid,
      line_user_id: user.line_user_id,
      role: user.role,
      is_active: user.is_active
    };

    db.addAuditLog({
      actor: getActorLabel(req),
      action: 'UPDATE_USER',
      targetType: 'USER',
      targetId: user.employee_no,
      reason: req.body?.reason || '後台更新會員資料 / 權限',
      beforeVal,
      afterVal
    });

    return res.json({
      code: 200,
      message: `已更新 ${user.name} 資料`,
      data: sanitizeUser(user)
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// POST /api/v1/admin/users/:id/adjust-points - Manual point adjustment with double-entry ledger & audit log
router.post('/users/:id/adjust-points', (req, res) => {
  try {
    const user = db.data.users.find(u => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ code: 404, message: '找不到該會員資料' });
    }

    const { mode = 'DELTA', amount, reason = '管理員手動補登/調整' } = req.body || {};
    const numAmount = Number(amount);
    if (Number.isNaN(numAmount)) {
      return res.status(400).json({ code: 400, message: '請輸入有效的點數數值' });
    }

    const currentBalance = db.getUserBalance(user.id);
    const delta = mode === 'SET' ? numAmount - currentBalance : numAmount;

    if (delta === 0) {
      return res.json({
        code: 200,
        message: '點數無異動',
        data: { current_balance: currentBalance }
      });
    }

    const { newBalance } = db.addLedgerEntry({
      userId: user.id,
      transactionType: 'ADMIN_ADJUST',
      points: delta,
      idempotencyKey: `ADMIN-ADJ-${user.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sourceRefId: 'ADMIN-PLATFORM',
      notes: String(reason).trim() || '管理員手動調整'
    });

    db.addAuditLog({
      actor: getActorLabel(req),
      action: 'ADJUST_USER_POINTS',
      targetType: 'USER',
      targetId: user.employee_no,
      reason: String(reason).trim() || '管理員手動調整',
      beforeVal: { balance: currentBalance },
      afterVal: { balance: newBalance, delta }
    });

    return res.json({
      code: 200,
      message: `已調整 ${user.name} 點數 (${delta > 0 ? '+' : ''}${delta} pt)，目前餘額 ${newBalance} pt`,
      data: { current_balance: newBalance }
    });
  } catch (err) {
    return res.status(400).json({ code: 400, message: err.message });
  }
});

// POST /api/v1/admin/users/:id/adjust-tree - Adjust user's tree state
router.post('/users/:id/adjust-tree', (req, res) => {
  try {
    const user = db.data.users.find(u => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ code: 404, message: '找不到該會員資料' });
    }

    const tree = db.getTreeStatus(user.id);
    const beforeVal = {
      current_level: tree.current_level,
      total_exp: tree.total_exp,
      pending_dew: tree.pending_dew
    };

    const { exp, dew } = req.body || {};
    if (exp !== undefined && !Number.isNaN(Number(exp))) {
      tree.total_exp = Math.max(0, Number(exp));
      const info = getTreeLevelInfo(tree.total_exp);
      tree.current_level = info.level;
    }
    if (dew !== undefined && !Number.isNaN(Number(dew))) {
      tree.pending_dew = Math.max(0, Number(dew));
    }
    tree.updated_at = new Date().toISOString();
    db.save();

    db.addAuditLog({
      actor: getActorLabel(req),
      action: 'ADJUST_USER_TREE',
      targetType: 'TREE',
      targetId: user.employee_no,
      reason: req.body?.reason || '後台調整健康樹經驗與露水',
      beforeVal,
      afterVal: {
        current_level: tree.current_level,
        total_exp: tree.total_exp,
        pending_dew: tree.pending_dew
      }
    });

    return res.json({
      code: 200,
      message: `已更新 ${user.name} 健康樹狀態 (Lv.${tree.current_level} / ${tree.total_exp} EXP / ${tree.pending_dew} 露水)`,
      data: tree
    });
  } catch (err) {
    return res.status(400).json({ code: 400, message: err.message });
  }
});

// ==================== 2. 日嚐好物管理 (Catalog & Goods Management) ====================

// GET /api/v1/admin/catalog
router.get('/catalog', (req, res) => {
  try {
    const redemptions = db.data.redemptions || [];
    const items = (db.data.catalog_items || []).map(item => {
      const redeemedCount = redemptions.filter(
        r => r.type === 'INTERNAL_VOUCHER' && (r.item_id === item.id || r.item_name === item.name)
      ).length;
      return {
        ...item,
        redeemed_count: redeemedCount
      };
    });
    return res.json({ code: 200, message: 'success', data: items });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// POST /api/v1/admin/catalog - Create new good
router.post('/catalog', (req, res) => {
  try {
    const {
      name,
      points,
      cashValue,
      category = 'LOCAL',
      icon = '🎁',
      stock = 50,
      is_active = true,
      description = ''
    } = req.body || {};

    if (!name || !points || Number(points) <= 0) {
      return res.status(400).json({ code: 400, message: '請填寫好物名稱與有效的兌換點數' });
    }

    const now = new Date().toISOString();
    const newItem = {
      id: `item-${Date.now().toString(36)}-${Math.floor(100 + Math.random() * 900)}`,
      name: String(name).trim(),
      points: Number(points),
      cashValue: Number(cashValue) || Number(points),
      category,
      icon: String(icon || '🎁').trim(),
      stock: Math.max(0, Number(stock) || 0),
      is_active: Boolean(is_active),
      description: String(description || '').trim(),
      created_at: now,
      updated_at: now
    };

    if (!Array.isArray(db.data.catalog_items)) {
      db.data.catalog_items = [];
    }
    db.data.catalog_items.push(newItem);
    db.save();

    db.addAuditLog({
      actor: getActorLabel(req),
      action: 'CREATE_CATALOG_ITEM',
      targetType: 'CATALOG',
      targetId: newItem.id,
      reason: `新增日嚐好物「${newItem.name}」`,
      beforeVal: null,
      afterVal: { name: newItem.name, points: newItem.points, stock: newItem.stock }
    });

    return res.status(201).json({
      code: 200,
      message: `已上架新好物「${newItem.name}」`,
      data: newItem
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// PATCH /api/v1/admin/catalog/:id - Update good details / stock / active status
router.patch('/catalog/:id', (req, res) => {
  try {
    const item = (db.data.catalog_items || []).find(c => c.id === req.params.id);
    if (!item) {
      return res.status(404).json({ code: 404, message: '找不到該日嚐好物項目' });
    }

    const beforeVal = {
      name: item.name,
      points: item.points,
      stock: item.stock,
      is_active: item.is_active
    };

    const { name, points, cashValue, category, icon, stock, is_active, description } = req.body || {};

    if (name !== undefined && String(name).trim()) item.name = String(name).trim();
    if (points !== undefined && Number(points) > 0) item.points = Number(points);
    if (cashValue !== undefined && Number(cashValue) >= 0) item.cashValue = Number(cashValue);
    if (category !== undefined) item.category = category;
    if (icon !== undefined && String(icon).trim()) item.icon = String(icon).trim();
    if (stock !== undefined && Number(stock) >= 0) item.stock = Number(stock);
    if (typeof is_active === 'boolean') item.is_active = is_active;
    if (description !== undefined) item.description = String(description).trim();

    item.updated_at = new Date().toISOString();
    db.save();

    db.addAuditLog({
      actor: getActorLabel(req),
      action: 'UPDATE_CATALOG_ITEM',
      targetType: 'CATALOG',
      targetId: item.id,
      reason: `更新日嚐好物「${item.name}」`,
      beforeVal,
      afterVal: {
        name: item.name,
        points: item.points,
        stock: item.stock,
        is_active: item.is_active
      }
    });

    return res.json({
      code: 200,
      message: `已更新「${item.name}」`,
      data: item
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// DELETE /api/v1/admin/catalog/:id - Remove catalog item
router.delete('/catalog/:id', (req, res) => {
  try {
    const idx = (db.data.catalog_items || []).findIndex(c => c.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ code: 404, message: '找不到該日嚐好物項目' });
    }

    const [removed] = db.data.catalog_items.splice(idx, 1);
    db.save();

    db.addAuditLog({
      actor: getActorLabel(req),
      action: 'DELETE_CATALOG_ITEM',
      targetType: 'CATALOG',
      targetId: removed.id,
      reason: `刪除日嚐好物「${removed.name}」`,
      beforeVal: { name: removed.name, points: removed.points },
      afterVal: null
    });

    return res.json({
      code: 200,
      message: `已刪除「${removed.name}」`
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// ==================== 運動項目維護 (Sport Items Management) ====================

// GET /api/v1/admin/sports - List all maintained sport items
router.get('/sports', (req, res) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    const list = (db.data.sport_items || [])
      .filter(item => {
        if (!q) return true;
        return (
          item.name.toLowerCase().includes(q) ||
          (item.location || '').toLowerCase().includes(q) ||
          (item.category || '').toLowerCase().includes(q) ||
          (item.qr_code || '').toLowerCase().includes(q)
        );
      })
      .map(item => db.enrichSportItem(item));
    return res.json({
      code: 200,
      message: 'success',
      data: list
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// POST /api/v1/admin/sports - Create a new sport item
router.post('/sports', (req, res) => {
  try {
    const {
      name,
      category = 'CARDIO',
      location = '體能教室',
      min_duration_mins = 30,
      reward_points = 1,
      reward_dew = 1,
      icon = '🏃',
      qr_code = '',
      usage_mode = 'MULTI',
      daily_limit = 1,
      description = '',
      is_active = true
    } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({ code: 400, message: '請填寫運動項目名稱' });
    }

    const parsedDuration = Number(min_duration_mins);
    const parsedPoints = Number(reward_points);
    const parsedDew = Number(reward_dew);
    const parsedDailyLimit = Number(daily_limit);

    if (!Number.isFinite(parsedDuration) || parsedDuration < 1) {
      return res.status(400).json({ code: 400, message: '達標運動分鐘數須為大於等於 1 的數字' });
    }
    if (!Number.isFinite(parsedPoints) || parsedPoints < 0 || !Number.isFinite(parsedDew) || parsedDew < 0) {
      return res.status(400).json({ code: 400, message: '獎勵點數與露水不可為負數' });
    }
    if (!Number.isFinite(parsedDailyLimit) || parsedDailyLimit < 0) {
      return res.status(400).json({ code: 400, message: '當日使用次數上限須為大於等於 0 的數字（0 代表不限次數）' });
    }
    if (!ALLOWED_SPORT_USAGE_MODES.includes(usage_mode)) {
      return res.status(400).json({ code: 400, message: '使用人數模式僅支援 MULTI（多人）或 SINGLE（單人）' });
    }

    if (!Array.isArray(db.data.sport_items)) {
      db.data.sport_items = [];
    }

    const sportId = `sport-${Date.now()}`;
    const resolvedQrCode = qr_code && String(qr_code).trim()
      ? String(qr_code).trim().toUpperCase()
      : `CSH-SPORT-${Date.now().toString(36).toUpperCase()}`;

    if (db.data.sport_items.some(s => (s.qr_code || '').toUpperCase() === resolvedQrCode)) {
      return res.status(409).json({ code: 409, message: `門禁 QR Code「${resolvedQrCode}」已被其他運動項目使用` });
    }

    const now = new Date().toISOString();
    const newSport = {
      id: sportId,
      name: String(name).trim(),
      category: ALLOWED_SPORT_CATEGORIES.includes(category) ? category : 'CARDIO',
      location: String(location || '體能教室').trim(),
      min_duration_mins: Math.round(parsedDuration),
      reward_points: Math.round(parsedPoints),
      reward_dew: Math.round(parsedDew),
      icon: icon ? String(icon).trim() : '🏃',
      qr_code: resolvedQrCode,
      usage_mode,
      daily_limit: Math.round(parsedDailyLimit),
      is_active: Boolean(is_active),
      description: String(description || '').trim(),
      created_at: now,
      updated_at: now
    };

    db.data.sport_items.push(newSport);
    db.save();

    db.addAuditLog({
      actor: getActorLabel(req),
      action: 'ADD_SPORT_ITEM',
      targetType: 'SPORT',
      targetId: newSport.id,
      reason: `新增運動項目「${newSport.name}」`,
      beforeVal: null,
      afterVal: {
        name: newSport.name,
        category: newSport.category,
        qr_code: newSport.qr_code,
        usage_mode: newSport.usage_mode,
        daily_limit: newSport.daily_limit,
        min_duration_mins: newSport.min_duration_mins,
        reward_points: newSport.reward_points
      }
    });

    return res.json({
      code: 200,
      message: `已新增運動項目「${newSport.name}」`,
      data: db.enrichSportItem(newSport)
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// PATCH /api/v1/admin/sports/:id - Update a sport item
router.patch('/sports/:id', (req, res) => {
  try {
    const list = db.data.sport_items || [];
    const item = list.find(s => s.id === req.params.id);
    if (!item) {
      return res.status(404).json({ code: 404, message: '找不到該運動項目' });
    }

    const beforeVal = {
      name: item.name,
      category: item.category,
      location: item.location,
      qr_code: item.qr_code,
      usage_mode: item.usage_mode || 'MULTI',
      daily_limit: item.daily_limit ?? 1,
      min_duration_mins: item.min_duration_mins,
      reward_points: item.reward_points,
      reward_dew: item.reward_dew,
      is_active: item.is_active
    };

    const {
      name,
      category,
      location,
      min_duration_mins,
      reward_points,
      reward_dew,
      icon,
      qr_code,
      usage_mode,
      daily_limit,
      description,
      is_active
    } = req.body || {};

    if (min_duration_mins !== undefined) {
      const parsedDuration = Number(min_duration_mins);
      if (!Number.isFinite(parsedDuration) || parsedDuration < 1) {
        return res.status(400).json({ code: 400, message: '達標運動分鐘數須為大於等於 1 的數字' });
      }
      item.min_duration_mins = Math.round(parsedDuration);
    }
    if (reward_points !== undefined) {
      const parsedPoints = Number(reward_points);
      if (!Number.isFinite(parsedPoints) || parsedPoints < 0) {
        return res.status(400).json({ code: 400, message: '獎勵點數不可為負數' });
      }
      item.reward_points = Math.round(parsedPoints);
    }
    if (reward_dew !== undefined) {
      const parsedDew = Number(reward_dew);
      if (!Number.isFinite(parsedDew) || parsedDew < 0) {
        return res.status(400).json({ code: 400, message: '獎勵露水不可為負數' });
      }
      item.reward_dew = Math.round(parsedDew);
    }
    if (usage_mode !== undefined) {
      if (!ALLOWED_SPORT_USAGE_MODES.includes(usage_mode)) {
        return res.status(400).json({ code: 400, message: '使用人數模式僅支援 MULTI（多人）或 SINGLE（單人）' });
      }
      item.usage_mode = usage_mode;
    }
    if (daily_limit !== undefined) {
      const parsedDailyLimit = Number(daily_limit);
      if (!Number.isFinite(parsedDailyLimit) || parsedDailyLimit < 0) {
        return res.status(400).json({ code: 400, message: '當日使用次數上限須為大於等於 0 的數字（0 代表不限次數）' });
      }
      item.daily_limit = Math.round(parsedDailyLimit);
    }
    if (qr_code !== undefined && String(qr_code).trim()) {
      const normalizedQr = String(qr_code).trim().toUpperCase();
      if (list.some(s => s.id !== item.id && (s.qr_code || '').toUpperCase() === normalizedQr)) {
        return res.status(409).json({ code: 409, message: `門禁 QR Code「${normalizedQr}」已被其他運動項目使用` });
      }
      item.qr_code = normalizedQr;
    }

    if (name !== undefined && String(name).trim()) item.name = String(name).trim();
    if (category !== undefined && ALLOWED_SPORT_CATEGORIES.includes(category)) item.category = category;
    if (location !== undefined) item.location = String(location).trim();
    if (icon !== undefined) item.icon = String(icon).trim() || '🏃';
    if (description !== undefined) item.description = String(description).trim();
    if (typeof is_active === 'boolean') item.is_active = is_active;
    item.updated_at = new Date().toISOString();

    db.save();

    db.addAuditLog({
      actor: getActorLabel(req),
      action: 'UPDATE_SPORT_ITEM',
      targetType: 'SPORT',
      targetId: item.id,
      reason: `更新運動項目「${item.name}」`,
      beforeVal,
      afterVal: {
        name: item.name,
        category: item.category,
        location: item.location,
        qr_code: item.qr_code,
        usage_mode: item.usage_mode,
        daily_limit: item.daily_limit,
        min_duration_mins: item.min_duration_mins,
        reward_points: item.reward_points,
        reward_dew: item.reward_dew,
        is_active: item.is_active
      }
    });

    return res.json({
      code: 200,
      message: `已更新運動項目「${item.name}」`,
      data: db.enrichSportItem(item)
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// DELETE /api/v1/admin/sports/:id - Remove a sport item
router.delete('/sports/:id', (req, res) => {
  try {
    const list = db.data.sport_items || [];
    const idx = list.findIndex(s => s.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ code: 404, message: '找不到該運動項目' });
    }

    const [removed] = list.splice(idx, 1);
    db.save();

    db.addAuditLog({
      actor: getActorLabel(req),
      action: 'DELETE_SPORT_ITEM',
      targetType: 'SPORT',
      targetId: removed.id,
      reason: `刪除運動項目「${removed.name}」`,
      beforeVal: { name: removed.name, min_duration_mins: removed.min_duration_mins },
      afterVal: null
    });

    return res.json({
      code: 200,
      message: `已刪除運動項目「${removed.name}」`
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// ==================== 3. 兌換券核銷與公益紀錄管理 ====================

// GET /api/v1/admin/redemptions - All vouchers & donations
router.get('/redemptions', (req, res) => {
  try {
    const list = (db.data.redemptions || [])
      .map(r => {
        const user = db.data.users.find(u => u.id === r.user_id);
        return {
          ...r,
          employee_no: user ? user.employee_no : 'N/A',
          employee_name: user ? user.name : 'N/A',
          dept_name: user ? user.dept_code : 'N/A'
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json({ code: 200, message: 'success', data: list });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// POST /api/v1/admin/redemptions/:id/status - Verify (USED) or Revoke with refund (REVOKED)
router.post('/redemptions/:id/status', (req, res) => {
  try {
    const { status } = req.body || {};
    const record = (db.data.redemptions || []).find(r => r.id === req.params.id);
    if (!record) {
      return res.status(404).json({ code: 404, message: '找不到該筆兌換紀錄' });
    }

    if (record.type !== 'INTERNAL_VOUCHER') {
      return res.status(400).json({ code: 400, message: '僅限實體/電子福利券可進行核銷或撤銷' });
    }

    if (record.status !== 'ACTIVE') {
      return res.status(400).json({ code: 400, message: `此票券目前狀態為 ${record.status}，無法再次變更` });
    }

    if (!['USED', 'REVOKED'].includes(status)) {
      return res.status(400).json({ code: 400, message: '不支援的目標狀態' });
    }

    const oldStatus = record.status;
    record.status = status;
    record.used_at = status === 'USED' ? new Date().toISOString() : null;

    if (status === 'REVOKED') {
      // Refund deducted points back to user
      db.addLedgerEntry({
        userId: record.user_id,
        transactionType: 'VOUCHER_REFUND',
        points: record.deducted_points,
        idempotencyKey: `REFUND-${record.id}`,
        sourceRefId: record.qr_voucher_code,
        notes: `管理員撤銷福利券「${record.item_name}」退還點數`
      });

      // Restore catalog stock if linked
      if (record.item_id) {
        const item = (db.data.catalog_items || []).find(c => c.id === record.item_id);
        if (item && typeof item.stock === 'number') {
          item.stock += 1;
        }
      }
    }
    db.save();

    db.addAuditLog({
      actor: getActorLabel(req),
      action: status === 'USED' ? 'ADMIN_VERIFY_VOUCHER' : 'ADMIN_REVOKE_VOUCHER',
      targetType: 'REDEMPTION',
      targetId: record.qr_voucher_code,
      reason: status === 'USED' ? `後台核銷「${record.item_name}」` : `後台作廢並退還 ${record.deducted_points} pt`,
      beforeVal: { status: oldStatus },
      afterVal: { status }
    });

    return res.json({
      code: 200,
      message: status === 'USED' ? '票券已核銷完成' : '票券已作廢並自動退還點數',
      data: record
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// ==================== 4. 稽核日誌、雙重記帳帳本與公益報表 ====================

// GET /api/v1/admin/audit-logs
router.get('/audit-logs', (req, res) => {
  try {
    return res.json({
      code: 200,
      message: 'success',
      data: db.data.audit_logs || []
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// GET /api/v1/admin/ledger - Double-entry ledger audit log
router.get('/ledger', (req, res) => {
  try {
    const targetUserId = req.user && req.user.role !== 'ADMIN' ? req.user.id : null;
    const entries = targetUserId
      ? db.data.point_ledger.filter(e => e.user_id === targetUserId)
      : db.data.point_ledger;
    const list = [...entries].map(e => {
      const u = db.data.users.find(user => user.id === e.user_id);
      return {
        ...e,
        employee_no: u ? u.employee_no : '',
        employee_name: u ? u.name : ''
      };
    }).reverse();
    return res.json({
      code: 200,
      message: 'success',
      data: list
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// GET /api/v1/admin/charity-report - Qianshan Foundation donation summary for accounting
router.get('/charity-report', (req, res) => {
  try {
    const charityRedemptions = db.data.redemptions
      .filter(r => r.type === 'CHARITY_DONATION')
      .map(r => {
        const user = db.getUser(r.user_id);
        return {
          ...r,
          employee_no: user ? user.employee_no : 'N/A',
          employee_name: user ? user.name : 'N/A',
          dept_name: user ? user.dept_code : 'N/A'
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const totalDonatedPoints = charityRedemptions.reduce((acc, r) => acc + r.deducted_points, 0);
    const totalMatchingFunds = charityRedemptions.reduce((acc, r) => acc + Number(r.actual_cash_value), 0);

    return res.json({
      code: 200,
      message: 'success',
      data: {
        summary: {
          total_records: charityRedemptions.length,
          total_donated_points: totalDonatedPoints,
          total_matching_funds_ntd: totalMatchingFunds,
          foundation_name: '財團法人南投縣私立前山社會福利慈善事業基金會',
          fiscal_year: '2026'
        },
        records: charityRedemptions
      }
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// ==================== HABIT TASKS MANAGEMENT (日常修養任務設定) ====================

// GET /api/v1/admin/habit-tasks - List all daily habit tasks sorted by sort_order
router.get('/habit-tasks', (req, res) => {
  try {
    const items = [...(db.data.habit_tasks || [])].sort(
      (a, b) => Number(a.sort_order || 999) - Number(b.sort_order || 999)
    );
    return res.json({
      code: 200,
      message: 'success',
      data: items
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// POST /api/v1/admin/habit-tasks - Create a new daily habit task
router.post('/habit-tasks', (req, res) => {
  try {
    const {
      category,
      title,
      description = '',
      icon = '🌿',
      points_reward = 1,
      dew_reward = 1,
      source_type = '自主打卡回報',
      habit_key = 'CUSTOM',
      sort_order,
      completed_status_text = '今日已達成',
      pending_status_text = '尚未完成',
      default_completed_at = null,
      is_active = true
    } = req.body;

    if (!category || !String(category).trim() || !title || !String(title).trim()) {
      return res.status(400).json({ code: 400, message: '修養分類與任務標題為必填欄位' });
    }

    const parsedPoints = Number(points_reward);
    const parsedDew = Number(dew_reward);
    if (Number.isNaN(parsedPoints) || parsedPoints < 0 || Number.isNaN(parsedDew) || parsedDew < 0) {
      return res.status(400).json({ code: 400, message: '獎勵點數與露水必須為大於或等於 0 的數字' });
    }

    const resolvedKey = ALLOWED_HABIT_KEYS.includes(habit_key) ? habit_key : 'CUSTOM';
    if (!Array.isArray(db.data.habit_tasks)) {
      db.data.habit_tasks = [];
    }

    const parsedOrder = sort_order !== undefined && sort_order !== '' && sort_order !== null
      ? Number(sort_order)
      : db.data.habit_tasks.length + 1;
    if (Number.isNaN(parsedOrder) || parsedOrder < 1) {
      return res.status(400).json({ code: 400, message: '排序順序必須為大於或等於 1 的整數' });
    }

    const now = new Date().toISOString();
    const newTask = {
      id: `task-${uuidv4().slice(0, 8)}`,
      category: String(category).trim(),
      title: String(title).trim(),
      description: String(description || '').trim(),
      icon: String(icon || '🌿').trim(),
      points_reward: Math.floor(parsedPoints),
      dew_reward: Math.floor(parsedDew),
      source_type: String(source_type || '自主打卡回報').trim(),
      habit_key: resolvedKey,
      sort_order: Math.floor(parsedOrder),
      completed_status_text: String(completed_status_text || '今日已達成').trim(),
      pending_status_text: String(pending_status_text || '尚未完成').trim(),
      default_completed_at: default_completed_at ? String(default_completed_at).trim() : null,
      is_active: Boolean(is_active),
      created_at: now,
      updated_at: now
    };

    db.data.habit_tasks.push(newTask);
    db.addAuditLog({
      actor: getActorLabel(req),
      action: 'ADD_HABIT_TASK',
      target: `${newTask.category}・${newTask.title}`,
      details: `獎勵 +${newTask.points_reward} pt / +${newTask.dew_reward} 露水，來源：${newTask.source_type}`
    });
    db.save();

    return res.status(201).json({
      code: 201,
      message: `已新增日常修養任務：${newTask.title}`,
      data: newTask
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// PATCH /api/v1/admin/habit-tasks/:id - Update a daily habit task
router.patch('/habit-tasks/:id', (req, res) => {
  try {
    const tasks = db.data.habit_tasks || [];
    const task = tasks.find(t => t.id === req.params.id);
    if (!task) {
      return res.status(404).json({ code: 404, message: '找不到該日常修養任務' });
    }

    const {
      category,
      title,
      description,
      icon,
      points_reward,
      dew_reward,
      source_type,
      habit_key,
      sort_order,
      completed_status_text,
      pending_status_text,
      default_completed_at,
      is_active
    } = req.body;

    if (category !== undefined) {
      if (!String(category).trim()) {
        return res.status(400).json({ code: 400, message: '修養分類不可為空' });
      }
      task.category = String(category).trim();
    }
    if (title !== undefined) {
      if (!String(title).trim()) {
        return res.status(400).json({ code: 400, message: '任務標題不可為空' });
      }
      task.title = String(title).trim();
    }
    if (description !== undefined) task.description = String(description || '').trim();
    if (icon !== undefined) task.icon = String(icon || '🌿').trim();
    if (source_type !== undefined) task.source_type = String(source_type || '自主打卡回報').trim();
    if (habit_key !== undefined && ALLOWED_HABIT_KEYS.includes(habit_key)) {
      task.habit_key = habit_key;
    }
    if (completed_status_text !== undefined) {
      task.completed_status_text = String(completed_status_text || '今日已達成').trim();
    }
    if (pending_status_text !== undefined) {
      task.pending_status_text = String(pending_status_text || '尚未完成').trim();
    }
    if (default_completed_at !== undefined) {
      task.default_completed_at = default_completed_at ? String(default_completed_at).trim() : null;
    }

    if (points_reward !== undefined) {
      const parsedPoints = Number(points_reward);
      if (Number.isNaN(parsedPoints) || parsedPoints < 0) {
        return res.status(400).json({ code: 400, message: '獎勵點數必須為大於或等於 0 的數字' });
      }
      task.points_reward = Math.floor(parsedPoints);
    }

    if (dew_reward !== undefined) {
      const parsedDew = Number(dew_reward);
      if (Number.isNaN(parsedDew) || parsedDew < 0) {
        return res.status(400).json({ code: 400, message: '獎勵露水必須為大於或等於 0 的數字' });
      }
      task.dew_reward = Math.floor(parsedDew);
    }

    if (sort_order !== undefined) {
      const parsedOrder = Number(sort_order);
      if (Number.isNaN(parsedOrder) || parsedOrder < 1) {
        return res.status(400).json({ code: 400, message: '排序順序必須為大於或等於 1 的整數' });
      }
      task.sort_order = Math.floor(parsedOrder);
    }

    if (typeof is_active === 'boolean') {
      task.is_active = is_active;
    }

    task.updated_at = new Date().toISOString();

    db.addAuditLog({
      actor: getActorLabel(req),
      action: 'UPDATE_HABIT_TASK',
      target: `${task.category}・${task.title}`,
      details: `獎勵 +${task.points_reward} pt / +${task.dew_reward} 露水，排序 #${task.sort_order}，狀態：${task.is_active !== false ? '啟用' : '停用'}`
    });
    db.save();

    return res.json({
      code: 200,
      message: `已更新日常修養任務「${task.title}」`,
      data: task
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// DELETE /api/v1/admin/habit-tasks/:id - Delete a daily habit task
router.delete('/habit-tasks/:id', (req, res) => {
  try {
    const tasks = db.data.habit_tasks || [];
    const index = tasks.findIndex(t => t.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ code: 404, message: '找不到該日常修養任務' });
    }

    const removed = tasks[index];
    tasks.splice(index, 1);

    db.addAuditLog({
      actor: getActorLabel(req),
      action: 'DELETE_HABIT_TASK',
      target: `${removed.category}・${removed.title}`,
      details: `已從日常修養任務移除「${removed.title}」`
    });
    db.save();

    return res.json({
      code: 200,
      message: `已刪除日常修養任務「${removed.title}」`
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// POST /api/v1/admin/set-points - Adjust current user health points (Demo shortcut)
router.post('/set-points', (req, res) => {
  try {
    const { target_points = 9999 } = req.body;
    const user = db.getUser(req.user?.id);
    const currentBalance = db.getUserBalance(user.id);
    const diff = Number(target_points) - currentBalance;

    if (diff !== 0) {
      const idempotencyKey = `ADMIN-ADJUST-${user.id}-${Date.now()}`;
      db.addLedgerEntry({
        userId: user.id,
        transactionType: 'ADMIN_ADJUST',
        points: diff,
        idempotencyKey,
        sourceRefId: 'SYS-ADMIN-OVERRIDE',
        notes: `管理員手動調整點數至 ${target_points} pt`
      });
    }

    const newBalance = db.getUserBalance(user.id);
    return res.json({
      code: 200,
      message: `點數已成功調整為 ${newBalance} pt`,
      data: { current_balance: newBalance }
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// POST /api/v1/admin/set-tree-state - Set tree level, exp and dew
router.post('/set-tree-state', (req, res) => {
  try {
    const { level = 1, exp = 0, dew = 99 } = req.body;
    const user = db.getUser(req.user?.id);
    const tree = db.getTreeStatus(user.id);
    tree.current_level = Number(level);
    tree.total_exp = Number(exp);
    tree.pending_dew = Number(dew);
    tree.updated_at = new Date().toISOString();
    db.save();
    return res.json({
      code: 200,
      message: `健康樹已設定為 Lv.${tree.current_level} (${tree.total_exp} EXP)，露水已給予 ${tree.pending_dew} 滴`,
      data: tree
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// POST /api/v1/admin/reset - Reset demo database
router.post('/reset', (req, res) => {
  try {
    db.reset();
    return res.json({
      code: 200,
      message: '系統資料已重設為初始演示狀態'
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

export default router;
