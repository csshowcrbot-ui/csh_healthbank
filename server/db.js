import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');

// Level definitions for tree_status
export const TREE_LEVELS = [
  { level: 1, name: '破土嫩芽', minExp: 0, maxExp: 50, description: '剛破土而出的竹筍新芽，帶著初生的晶瑩晨露。' },
  { level: 2, name: '茁壯若竹', minExp: 51, maxExp: 150, description: '青翠修長的小竹，枝葉迎風舒展，展現生命堅韌。' },
  { level: 3, name: '茂盛成樹', minExp: 151, maxExp: 300, description: '綠蔭成蓋，枝繁葉茂，為過客送來滿園寧靜微風。' },
  { level: 4, name: '開花之樹', minExp: 301, maxExp: 500, description: '枝頭綴滿恬淡清芬的和風小白花，芬芳四溢。' },
  { level: 5, name: '結實金樹', minExp: 501, maxExp: 999999, description: '碩果累累的金色智慧樹，成就身心雙向圓滿。' }
];

// Helper to calculate tree level from totalExp
export function getTreeLevelInfo(totalExp) {
  for (let i = TREE_LEVELS.length - 1; i >= 0; i--) {
    if (totalExp >= TREE_LEVELS[i].minExp) {
      const current = TREE_LEVELS[i];
      const next = TREE_LEVELS[i + 1] || null;
      return {
        level: current.level,
        levelName: current.name,
        currentExp: totalExp,
        nextLevelExp: next ? next.minExp : current.maxExp,
        description: current.description,
        isMaxLevel: !next
      };
    }
  }
  return {
    level: 1,
    levelName: TREE_LEVELS[0].name,
    currentExp: totalExp,
    nextLevelExp: TREE_LEVELS[1].minExp,
    description: TREE_LEVELS[0].description,
    isMaxLevel: false
  };
}

// Default catalog items for 日嚐好物
export function getDefaultCatalogItems() {
  const now = new Date().toISOString();
  return [
    {
      id: 'canteen-50',
      name: '員工餐廳 50 元折抵券',
      points: 50,
      cashValue: 50,
      category: 'MEAL',
      icon: '🍱',
      stock: 100,
      is_active: true,
      description: '憑 QR Code 於醫院員工餐廳結帳時折抵 50 元消費，當日現折。',
      created_at: now,
      updated_at: now
    },
    {
      id: 'towel-80',
      name: '秀傳簡約運動吸水巾',
      points: 80,
      cashValue: 80,
      category: 'SPORTS',
      icon: '🧣',
      stock: 50,
      is_active: true,
      description: '100% 純棉雙面微孔吸水，透氣速乾，附秀傳綠葉刺繡，體能運動良伴。',
      created_at: now,
      updated_at: now
    },
    {
      id: 'oolong-tea-100',
      name: '竹山在地高山烏龍冷泡茶組',
      points: 100,
      cashValue: 100,
      category: 'LOCAL',
      icon: '🍵',
      stock: 40,
      is_active: true,
      description: '嚴選竹山大鞍高山茶園手採高山茶，清香甘醇，解熱生津。',
      created_at: now,
      updated_at: now
    },
    {
      id: 'massage-150',
      name: '院內心理舒壓音療體驗券 (30分)',
      points: 150,
      cashValue: 150,
      category: 'WELLNESS',
      icon: '🧘',
      stock: 20,
      is_active: true,
      description: '由院內身心健康中心專業芳療放鬆空間提供 30 分鐘頌缽音療放鬆。',
      created_at: now,
      updated_at: now
    }
  ];
}

// Default sport items for 運動項目維護
export function getDefaultSportItems() {
  const now = new Date().toISOString();
  return [
    {
      id: 'sport-treadmill',
      name: '跑步機有氧訓練',
      category: 'CARDIO',
      location: '體能教室 A 區',
      min_duration_mins: 30,
      reward_points: 1,
      reward_dew: 1,
      icon: '🏃',
      qr_code: 'CSH-SPORT-TREADMILL',
      usage_mode: 'SINGLE',
      daily_limit: 1,
      is_active: true,
      description: '配備心率監測跑步機，持續慢跑或快走達標即可獲健康點數與露水。',
      created_at: now,
      updated_at: now
    },
    {
      id: 'sport-strength',
      name: '重訓肌力訓練',
      category: 'STRENGTH',
      location: '體能教室 B 區',
      min_duration_mins: 30,
      reward_points: 1,
      reward_dew: 1,
      icon: '🏋️',
      qr_code: 'CSH-SPORT-STRENGTH',
      usage_mode: 'MULTI',
      daily_limit: 1,
      is_active: true,
      description: '啞鈴與多功能肌力訓練器材，強化核心與上下肢肌耐力。',
      created_at: now,
      updated_at: now
    },
    {
      id: 'sport-cycling',
      name: '飛輪有氧訓練',
      category: 'CARDIO',
      location: '體能教室飛輪區',
      min_duration_mins: 30,
      reward_points: 1,
      reward_dew: 1,
      icon: '🚴',
      qr_code: 'CSH-SPORT-CYCLING',
      usage_mode: 'MULTI',
      daily_limit: 1,
      is_active: true,
      description: '室內有氧飛輪踩踏訓練，有效提升心肺適能與燃脂效率。',
      created_at: now,
      updated_at: now
    },
    {
      id: 'sport-yoga',
      name: '舒壓伸展瑜珈',
      category: 'FLEXIBILITY',
      location: '身心韻律教室',
      min_duration_mins: 30,
      reward_points: 1,
      reward_dew: 1,
      icon: '🧘',
      qr_code: 'CSH-SPORT-YOGA',
      usage_mode: 'MULTI',
      daily_limit: 1,
      is_active: true,
      description: '溫和伸展肩頸與下背肌群，舒緩醫護輪班累積之身心疲勞。',
      created_at: now,
      updated_at: now
    }
  ];
}

// Default daily cultivation / habit tasks builder
export function getDefaultHabitTasks() {
  const now = new Date().toISOString();
  return [
    {
      id: 'task-vege',
      category: '日嚐',
      title: '蔬食之日',
      description: '每週一、二享用無肉蔬食餐點，於餐檯嗶卡自動登記。',
      icon: '🥗',
      points_reward: 1,
      dew_reward: 1,
      source_type: 'POS感應刷卡',
      habit_key: 'VEGETARIAN',
      sort_order: 1,
      completed_status_text: '今日已達成',
      pending_status_text: '尚未感應刷卡',
      default_completed_at: '12:15',
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      id: 'task-edu',
      category: '習藝',
      title: '院內教育與講座傳承',
      description: '參與健康促進課程或出任院內講師，滋養內在底蘊。',
      icon: '🎓',
      points_reward: 2,
      dew_reward: 2,
      source_type: '人資教學系統',
      habit_key: 'EDUCATION',
      sort_order: 2,
      completed_status_text: '本月時數合格',
      pending_status_text: '點擊查看本月課表',
      default_completed_at: '10/24 14:00',
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      id: 'task-checkup',
      category: '養身',
      title: '定期健檢與癌篩',
      description: '完成年度員工體檢或四癌篩檢，系統定期自動串接。',
      icon: '🩺',
      points_reward: 2,
      dew_reward: 2,
      source_type: '檢驗科 HIS 系統',
      habit_key: 'CHECKUP',
      sort_order: 3,
      completed_status_text: '年度核算合格',
      pending_status_text: '檢驗科查核中',
      default_completed_at: '10/15',
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      id: 'task-gym',
      category: '行健',
      title: '院內體能空間使用',
      description: '跑步機、重訓器材感應刷卡達 30 分鐘，活絡氣血。',
      icon: '🏃',
      points_reward: 1,
      dew_reward: 1,
      source_type: '體能教室門禁',
      habit_key: 'GYM',
      sort_order: 4,
      completed_status_text: '今日已達成 (30分)',
      pending_status_text: '尚未展開運動',
      default_completed_at: null,
      is_active: true,
      created_at: now,
      updated_at: now
    }
  ];
}

// Initial state builder
function getInitialData() {
  const defaultUserId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const now = new Date().toISOString();

  return {
    users: [
      {
        id: defaultUserId,
        employee_no: 'E2108',
        line_user_id: 'U1234567890abcdef',
        card_uid: 'CARD-CSH-8821',
        name: '陳小嵐',
        dept_code: '急診護理部',
        role: 'STAFF',
        is_active: true,
        created_at: '2026-01-01T08:00:00Z',
        updated_at: now
      },
      {
        id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        employee_no: 'A0001',
        line_user_id: 'Uadmin999888',
        card_uid: 'CARD-CSH-0001',
        name: '林家豪 (職安衛管理師)',
        dept_code: '職業安全衛生室',
        role: 'ADMIN',
        is_active: true,
        created_at: '2026-01-01T08:00:00Z',
        updated_at: now
      }
    ],
    tree_status: {
      [defaultUserId]: {
        user_id: defaultUserId,
        current_level: 2,
        total_exp: 120,
        pending_dew: 2, // 2 drops waiting
        last_watered_at: '2026-10-29T18:30:00Z',
        updated_at: now
      }
    },
    point_ledger: [
      {
        id: 1,
        user_id: defaultUserId,
        transaction_type: 'INITIAL_GRANT',
        points: 100,
        balance_snapshot: 100,
        idempotency_key: 'INIT-GRANT-20261001',
        source_ref_id: 'INIT-SYS',
        notes: '系統啟用健管初始入帳',
        created_at: '2026-10-01T08:00:00Z'
      },
      {
        id: 2,
        user_id: defaultUserId,
        transaction_type: 'EARN_CHECKUP',
        points: 20,
        balance_snapshot: 120,
        idempotency_key: 'HIS-CHECKUP-20261015-E2108',
        source_ref_id: 'HIS-MED-2026-0988',
        notes: '年度員工定期體檢合格入帳',
        created_at: '2026-10-15T09:00:00Z'
      }
    ],
    redemptions: [
      {
        id: uuidv4(),
        user_id: defaultUserId,
        type: 'INTERNAL_VOUCHER',
        item_name: '員工餐廳 50 元折抵券',
        deducted_points: 50,
        actual_cash_value: 50.0,
        qr_voucher_code: 'CSH-VOUCHER-DEMO-01',
        status: 'USED',
        used_at: '2026-10-20T12:30:00Z',
        created_at: '2026-10-20T11:00:00Z'
      }
    ],
    raw_hardware_logs: [
      {
        id: 1,
        source: 'POS_RESTAURANT',
        raw_payload: { terminal: 'POS-02', receipt: 'R20261028-0442', card_uid: 'CARD-CSH-8821', item: '蔬食套餐' },
        status: 'SUCCESS',
        message: '週二蔬食感應成功，入點 +1，露水 +1',
        created_at: '2026-10-28T12:15:00Z'
      }
    ],
    notifications: [
      {
        id: uuidv4(),
        title: '竹山秀傳健康銀行・溫馨提醒',
        message: '今日已累積 2 滴晨露，別忘了在庭園中為您的若竹輕柔澆灌。',
        type: 'info',
        is_read: false,
        created_at: now
      }
    ],
    gym_sessions: {}, // card_uid -> { startTime, terminal }
    gym_qr_tokens: {}, // qr_code -> { qr_code, card_uid, used, expires_at }
    sport_daily_usage: {}, // date -> { user_id -> { sport_id -> count } }
    habits_status: {
      [defaultUserId]: {
        vegetarian_today: false,
        vegetarian_time: null,
        gym_today: false,
        gym_time: null,
        education_enrolled: true,
        checkup_completed: true,
        cancer_screen_completed: true
      }
    },
    catalog_items: getDefaultCatalogItems(),
    sport_items: getDefaultSportItems(),
    habit_tasks: getDefaultHabitTasks(),
    audit_logs: []
  };
}

class Database {
  constructor() {
    this.data = null;
    this.mutex = false;
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        let migrated = false;
        if (!Array.isArray(this.data.catalog_items)) {
          this.data.catalog_items = getDefaultCatalogItems();
          migrated = true;
        }
        if (!Array.isArray(this.data.sport_items)) {
          this.data.sport_items = getDefaultSportItems();
          migrated = true;
        } else {
          for (const sport of this.data.sport_items) {
            if (!sport.qr_code) {
              const suffix = String(sport.id || '').replace(/^sport-/, '').toUpperCase() || Date.now().toString(36).toUpperCase();
              sport.qr_code = `CSH-SPORT-${suffix}`;
              migrated = true;
            }
            if (!sport.usage_mode) {
              sport.usage_mode = sport.id === 'sport-treadmill' ? 'SINGLE' : 'MULTI';
              migrated = true;
            }
            if (sport.daily_limit === undefined || sport.daily_limit === null) {
              sport.daily_limit = 1;
              migrated = true;
            }
          }
        }
        if (!this.data.sport_daily_usage || typeof this.data.sport_daily_usage !== 'object') {
          this.data.sport_daily_usage = {};
          migrated = true;
        }
        if (!Array.isArray(this.data.habit_tasks)) {
          this.data.habit_tasks = getDefaultHabitTasks();
          migrated = true;
        }
        if (!Array.isArray(this.data.audit_logs)) {
          this.data.audit_logs = [];
          migrated = true;
        }
        if (migrated) {
          this.save();
        }
      } else {
        this.data = getInitialData();
        this.save();
      }
    } catch (err) {
      console.warn('Could not read existing data file, initializing fresh state:', err);
      this.data = getInitialData();
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving data to disk:', err);
    }
  }

  reset() {
    this.data = getInitialData();
    this.save();
    return this.data;
  }

  getUser(userId) {
    return this.data.users.find(u => u.id === userId) || this.data.users[0];
  }

  getUserByCardUid(cardUid) {
    return this.data.users.find(u => u.card_uid === cardUid);
  }

  getUserByEmployeeNo(empNo) {
    return this.data.users.find(u => u.employee_no === empNo);
  }

  // Get current point balance from ledger (double-entry truth)
  getUserBalance(userId) {
    const userLedger = this.data.point_ledger.filter(entry => entry.user_id === userId);
    return userLedger.reduce((sum, item) => sum + item.points, 0);
  }

  // Append entry to point ledger with double-entry idempotency and balance snapshot
  addLedgerEntry({ userId, transactionType, points, idempotencyKey, sourceRefId, notes }) {
    // Check idempotency key to prevent double spending / double rewarding
    const exists = this.data.point_ledger.find(e => e.idempotency_key === idempotencyKey);
    if (exists) {
      throw new Error(`重複交易請求：冪等鍵 ${idempotencyKey} 已存在`);
    }

    const currentBalance = this.getUserBalance(userId);
    const newBalance = currentBalance + points;

    if (newBalance < 0) {
      throw new Error(`點數餘額不足！當前餘額: ${currentBalance} pt, 擬扣除: ${Math.abs(points)} pt`);
    }

    const entry = {
      id: this.data.point_ledger.length + 1,
      user_id: userId,
      transaction_type: transactionType,
      points,
      balance_snapshot: newBalance,
      idempotency_key: idempotencyKey,
      source_ref_id: sourceRefId || '',
      notes: notes || '',
      created_at: new Date().toISOString()
    };

    this.data.point_ledger.push(entry);
    this.save();
    return { entry, newBalance };
  }

  // Tree Status
  getTreeStatus(userId) {
    if (!this.data.tree_status[userId]) {
      this.data.tree_status[userId] = {
        user_id: userId,
        current_level: 1,
        total_exp: 0,
        pending_dew: 0,
        last_watered_at: null,
        updated_at: new Date().toISOString()
      };
      this.save();
    }
    return this.data.tree_status[userId];
  }

  // Water tree
  waterTree(userId, amount = 1) {
    const tree = this.getTreeStatus(userId);
    if (tree.pending_dew < amount) {
      throw new Error(`待領取水滴露水不足 (目前剩餘: ${tree.pending_dew} 滴)`);
    }

    const expPerDrop = 10;
    const expGained = amount * expPerDrop;
    const oldLevel = tree.current_level;

    tree.pending_dew -= amount;
    tree.total_exp += expGained;
    tree.last_watered_at = new Date().toISOString();
    tree.updated_at = new Date().toISOString();

    const levelInfo = getTreeLevelInfo(tree.total_exp);
    tree.current_level = levelInfo.level;

    const isLevelUp = tree.current_level > oldLevel;
    this.save();

    return {
      expGained,
      totalExp: tree.total_exp,
      remainingDew: tree.pending_dew,
      isLevelUp,
      newLevel: tree.current_level,
      levelInfo
    };
  }

  // Add dew drops (e.g. from healthy habits like sports or veggies)
  addDew(userId, count = 1) {
    const tree = this.getTreeStatus(userId);
    tree.pending_dew = (tree.pending_dew || 0) + count;
    tree.updated_at = new Date().toISOString();
    this.save();
    return tree.pending_dew;
  }

  // Add notification
  addNotification({ title, message, type = 'info' }) {
    const notif = {
      id: uuidv4(),
      title,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString()
    };
    this.data.notifications.unshift(notif);
    if (this.data.notifications.length > 30) {
      this.data.notifications.pop();
    }
    this.save();
    return notif;
  }

  // Add hardware raw log
  addHardwareLog({ source, rawPayload, status, message }) {
    const log = {
      id: this.data.raw_hardware_logs.length + 1,
      source,
      raw_payload: rawPayload,
      status,
      message,
      created_at: new Date().toISOString()
    };
    this.data.raw_hardware_logs.unshift(log);
    if (this.data.raw_hardware_logs.length > 100) {
      this.data.raw_hardware_logs.pop();
    }
    this.save();
    return log;
  }

  // Add compliance audit log (Section 5.3)
  addAuditLog({ actor, action, targetType, targetId, reason, beforeVal, afterVal }) {
    if (!Array.isArray(this.data.audit_logs)) {
      this.data.audit_logs = [];
    }
    const log = {
      id: uuidv4(),
      actor: actor || 'SYSTEM',
      action,
      target_type: targetType,
      target_id: targetId,
      reason: reason || '',
      before_val: beforeVal ?? null,
      after_val: afterVal ?? null,
      created_at: new Date().toISOString()
    };
    this.data.audit_logs.unshift(log);
    if (this.data.audit_logs.length > 200) {
      this.data.audit_logs.pop();
    }
    this.save();
    return log;
  }

  getUserSportDailyUsage(userId, sportId, dateStr = new Date().toISOString().slice(0, 10)) {
    if (!userId || !sportId) return 0;
    return Number(this.data.sport_daily_usage?.[dateStr]?.[userId]?.[sportId] || 0);
  }

  incrementUserSportDailyUsage(userId, sportId, dateStr = new Date().toISOString().slice(0, 10)) {
    if (!userId || !sportId) return 0;
    if (!this.data.sport_daily_usage || typeof this.data.sport_daily_usage !== 'object') {
      this.data.sport_daily_usage = {};
    }
    if (!this.data.sport_daily_usage[dateStr]) {
      this.data.sport_daily_usage[dateStr] = {};
    }
    if (!this.data.sport_daily_usage[dateStr][userId]) {
      this.data.sport_daily_usage[dateStr][userId] = {};
    }
    const nextCount = (this.data.sport_daily_usage[dateStr][userId][sportId] || 0) + 1;
    this.data.sport_daily_usage[dateStr][userId][sportId] = nextCount;
    this.save();
    return nextCount;
  }

  // Enrich a sport item with live gym session occupancy info & daily limit usage
  enrichSportItem(sport, userId = null) {
    const activeSessions = Object.values(this.data.gym_sessions || {}).filter(
      s => s.sport_id === sport.id
    );
    const parsedLimit = Number(sport.daily_limit);
    const dailyLimit = Number.isFinite(parsedLimit) && parsedLimit >= 0 ? Math.round(parsedLimit) : 1;
    return {
      ...sport,
      qr_code: sport.qr_code || `CSH-SPORT-${String(sport.id).replace(/^sport-/, '').toUpperCase()}`,
      usage_mode: sport.usage_mode === 'SINGLE' ? 'SINGLE' : 'MULTI',
      daily_limit: dailyLimit,
      ...(userId ? { user_today_usage: this.getUserSportDailyUsage(userId, sport.id) } : {}),
      active_users_count: activeSessions.length,
      occupied_by: activeSessions.map(s => ({
        user_name: s.user_name,
        card_uid: s.card_uid,
        start_time: s.start_time
      }))
    };
  }
}

export const db = new Database();
export default db;

