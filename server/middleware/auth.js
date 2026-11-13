import jwt from 'jsonwebtoken';
import db from '../db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'csh-healthbank-dev-secret-2026';

export function signUserToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      employee_no: user.employee_no,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

/**
 * Optional auth middleware: if a Bearer token is supplied, verifies it and attaches req.user.
 * Invalid/expired tokens return 401; missing tokens leave req.user = null for backward compatibility.
 */
export function attachUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.data.users.find(u => u.id === payload.sub);
    if (!user || !user.is_active) {
      return res.status(401).json({ code: 401, message: '帳號不存在或已停用，請重新登入' });
    }
    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ code: 401, message: '登入憑證已失效，請重新登入' });
  }
}

/**
 * Strict auth middleware: requires a valid Bearer JWT.
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ code: 401, message: '請先登入系統' });
  }
  return next();
}

/**
 * Strict admin middleware: requires an authenticated user with ADMIN role.
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ code: 401, message: '請先登入系統管理員帳號' });
  }
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      code: 403,
      message: `權限不足：目前身分為 ${req.user.role}，僅限系統管理員 (ADMIN) 操作後台作業`
    });
  }
  return next();
}

