import express from 'express';
import db from '../db.js';
import { signUserToken, sanitizeUser, requireAuth } from '../middleware/auth.js';

const router = express.Router();

const DEFAULT_DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'csh1234';

// GET /api/v1/auth/demo-accounts - List non-sensitive account info for quick demo login
router.get('/demo-accounts', (req, res) => {
  const accounts = db.data.users
    .filter(u => u.is_active)
    .map(u => ({
      employee_no: u.employee_no,
      name: u.name,
      dept_code: u.dept_code,
      role: u.role,
      line_user_id: u.line_user_id
    }));

  return res.json({
    code: 200,
    message: 'success',
    data: accounts
  });
});

// POST /api/v1/auth/login - Employee No + Password login (Active Directory / Employee Credential)
router.post('/login', (req, res) => {
  try {
    const { employee_no, password } = req.body || {};

    if (!employee_no || !password) {
      return res.status(400).json({
        code: 400,
        message: '請輸入員工工號與登入密碼'
      });
    }

    const normalizedEmpNo = String(employee_no).trim().toUpperCase();
    const user = db.data.users.find(
      u => u.employee_no.toUpperCase() === normalizedEmpNo
    );

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: `查無員工工號「${normalizedEmpNo}」`
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        code: 403,
        message: '此員工帳號已停用，請洽職安衛室或人資課'
      });
    }

    const expectedPassword = user.password || DEFAULT_DEMO_PASSWORD;
    if (String(password) !== expectedPassword) {
      return res.status(401).json({
        code: 401,
        message: '登入密碼錯誤，請再確認一次'
      });
    }

    const token = signUserToken(user);
    return res.json({
      code: 200,
      message: `歡迎回來，${user.name}`,
      data: {
        token,
        user: sanitizeUser(user)
      }
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// POST /api/v1/auth/line-login - LINE LIFF OAuth 2.0 & Employee Binding (temporarily disabled)
const ENABLE_LINE_LOGIN = false;
router.post('/line-login', (req, res) => {
  if (!ENABLE_LINE_LOGIN) {
    return res.status(403).json({
      code: 403,
      message: 'LINE 帳號一鍵登入功能暫時關閉，請使用員工工號與密碼登入'
    });
  }
  try {
    const { line_user_id, employee_no } = req.body || {};

    if (!line_user_id && !employee_no) {
      return res.status(400).json({
        code: 400,
        message: '缺少 LINE UID 或員工工號'
      });
    }

    let user = line_user_id
      ? db.data.users.find(u => u.line_user_id === line_user_id)
      : null;

    // Bind LINE UID to employee_no if not already linked
    if (!user && employee_no) {
      const normalizedEmpNo = String(employee_no).trim().toUpperCase();
      user = db.data.users.find(u => u.employee_no.toUpperCase() === normalizedEmpNo);
      if (!user) {
        return res.status(404).json({
          code: 404,
          message: `查無員工工號「${normalizedEmpNo}」，無法進行 LINE 綁定`
        });
      }
      if (line_user_id) {
        user.line_user_id = line_user_id;
        user.updated_at = new Date().toISOString();
        db.save();
      }
    }

    if (!user || !user.is_active) {
      return res.status(401).json({
        code: 401,
        message: 'LINE 帳號尚未綁定院內員工證號或已停用'
      });
    }

    const token = signUserToken(user);
    return res.json({
      code: 200,
      message: `LINE LIFF 單一登入成功：${user.name}`,
      data: {
        token,
        user: sanitizeUser(user)
      }
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// GET /api/v1/auth/me - Validate current JWT session
router.get('/me', requireAuth, (req, res) => {
  return res.json({
    code: 200,
    message: 'success',
    data: sanitizeUser(req.user)
  });
});

export default router;

