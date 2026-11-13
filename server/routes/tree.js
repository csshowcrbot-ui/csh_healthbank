import express from 'express';
import db, { getTreeLevelInfo } from '../db.js';

const router = express.Router();

// GET /api/v1/tree/dashboard
router.get('/dashboard', (req, res) => {
  try {
    const user = db.getUser(req.user?.id);
    const balance = db.getUserBalance(user.id);
    const tree = db.getTreeStatus(user.id);
    const levelInfo = getTreeLevelInfo(tree.total_exp);

    return res.json({
      code: 200,
      message: 'success',
      data: {
        employee_info: {
          id: user.id,
          name: user.name,
          employee_no: user.employee_no,
          dept_name: user.dept_code,
          card_uid: user.card_uid,
          role: user.role
        },
        points: {
          current_balance: balance,
          cash_equivalent: balance // 10 pt = 10 元福利折抵 (1 pt = 1 元)
        },
        tree: {
          current_level: levelInfo.level,
          level_name: levelInfo.levelName,
          current_exp: tree.total_exp,
          next_level_exp: levelInfo.nextLevelExp,
          pending_dew: tree.pending_dew,
          description: levelInfo.description,
          is_max_level: levelInfo.isMaxLevel,
          last_watered_at: tree.last_watered_at
        },
        charity_eligible: balance >= 100
      }
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// POST /api/v1/tree/water
router.post('/water', (req, res) => {
  try {
    const { water_amount = 1 } = req.body;
    const user = db.getUser(req.user?.id);

    const result = db.waterTree(user.id, Number(water_amount));

    db.addNotification({
      title: '庭園微風・滋養新葉',
      message: `已完成滴水澆灌，若竹獲得 +${result.expGained} 點成長養分！`,
      type: 'success'
    });

    return res.json({
      code: 200,
      message: '樹木澆灌成功',
      data: {
        exp_gained: result.expGained,
        total_exp: result.totalExp,
        remaining_dew: result.remainingDew,
        is_level_up: result.isLevelUp,
        new_level: result.newLevel,
        level_name: result.levelInfo.levelName
      }
    });
  } catch (err) {
    return res.status(400).json({ code: 400, message: err.message });
  }
});

export default router;

