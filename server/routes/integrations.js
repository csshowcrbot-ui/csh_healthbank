import express from 'express';
import db from '../db.js';

const router = express.Router();

function resolveHabitTaskState(task, habit, todayDate) {
  const key = task.habit_key || 'CUSTOM';
  if (key === 'VEGETARIAN') {
    const isCompleted = Boolean(habit.vegetarian_today);
    return {
      isCompleted,
      statusText: isCompleted
        ? (task.completed_status_text || '今日已達成')
        : (task.pending_status_text || '尚未感應刷卡'),
      completedAt: habit.vegetarian_time || task.default_completed_at || null
    };
  }
  if (key === 'EDUCATION') {
    const isCompleted = Boolean(habit.education_enrolled);
    return {
      isCompleted,
      statusText: isCompleted
        ? (task.completed_status_text || '本月時數合格')
        : (task.pending_status_text || '點擊查看本月課表'),
      completedAt: task.default_completed_at || '10/24 14:00'
    };
  }
  if (key === 'CHECKUP') {
    const isCompleted = Boolean(habit.checkup_completed && habit.cancer_screen_completed);
    return {
      isCompleted,
      statusText: isCompleted
        ? (task.completed_status_text || '年度核算合格')
        : (task.pending_status_text || '檢驗科查核中'),
      completedAt: task.default_completed_at || '10/15'
    };
  }
  if (key === 'GYM') {
    const isCompleted = Boolean(habit.gym_today);
    return {
      isCompleted,
      statusText: isCompleted
        ? (task.completed_status_text || '今日已達成 (30分)')
        : (task.pending_status_text || '尚未展開運動'),
      completedAt: habit.gym_time || task.default_completed_at || null
    };
  }
  const customRecord = habit.custom_completions?.[todayDate]?.[task.id];
  const isCompleted = Boolean(customRecord);
  return {
    isCompleted,
    statusText: isCompleted
      ? (task.completed_status_text || '今日已達成')
      : (task.pending_status_text || '尚未完成'),
    completedAt: customRecord?.completedAt || null
  };
}

function getConfiguredHabitRewards(habitKey, defaultPoints, defaultDew) {
  const matched = (db.data.habit_tasks || []).find(
    t => t.habit_key === habitKey && t.is_active !== false
  );
  if (!matched) {
    return { pointsReward: defaultPoints, dewReward: defaultDew };
  }
  return {
    pointsReward: Math.max(0, Number(matched.points_reward ?? defaultPoints)),
    dewReward: Math.max(0, Number(matched.dew_reward ?? defaultDew))
  };
}

// GET /api/v1/tasks/today - Get today's configured Japanese habit tasks status
router.get('/today', (req, res) => {
  try {
    const user = db.getUser(req.user?.id);
    const todayDate = new Date().toISOString().slice(0, 10);
    const habit = db.data.habits_status[user.id] || {
      vegetarian_today: false,
      vegetarian_time: null,
      gym_today: false,
      gym_time: null,
      education_enrolled: true,
      checkup_completed: true,
      cancer_screen_completed: true
    };

    const configuredTasks = [...(db.data.habit_tasks || [])]
      .filter(t => t.is_active !== false)
      .sort((a, b) => Number(a.sort_order || 999) - Number(b.sort_order || 999));

    const tasks = configuredTasks.map(task => {
      const state = resolveHabitTaskState(task, habit, todayDate);
      return {
        id: task.id,
        category: task.category,
        title: task.title,
        description: task.description,
        icon: task.icon || '🌿',
        pointsReward: Number(task.points_reward ?? 1),
        dewReward: Number(task.dew_reward ?? 1),
        isCompleted: state.isCompleted,
        statusText: state.statusText,
        completedAt: state.completedAt,
        sourceType: task.source_type || '系統整合',
        habitKey: task.habit_key || 'CUSTOM',
        sortOrder: Number(task.sort_order || 999)
      };
    });

    return res.json({
      code: 200,
      message: 'success',
      data: {
        user: {
          name: user.name,
          employee_no: user.employee_no,
          card_uid: user.card_uid
        },
        tasks,
        active_gym_session: db.data.gym_sessions[user.card_uid] || null
      }
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// POST /api/v1/tasks/:taskId/complete - Self check-in for CUSTOM daily habit tasks
router.post('/:taskId/complete', (req, res) => {
  try {
    const user = db.getUser(req.user?.id);
    const task = (db.data.habit_tasks || []).find(
      t => t.id === req.params.taskId && t.is_active !== false
    );
    if (!task) {
      return res.status(404).json({ code: 404, message: '找不到該啟用中的日常修養任務' });
    }
    if ((task.habit_key || 'CUSTOM') !== 'CUSTOM') {
      return res.status(400).json({ code: 400, message: '此任務由院內感應設備或系統自動同步，無法手動打卡' });
    }

    const todayDate = new Date().toISOString().slice(0, 10);
    if (!db.data.habits_status[user.id]) {
      db.data.habits_status[user.id] = {};
    }
    if (!db.data.habits_status[user.id].custom_completions) {
      db.data.habits_status[user.id].custom_completions = {};
    }
    if (!db.data.habits_status[user.id].custom_completions[todayDate]) {
      db.data.habits_status[user.id].custom_completions[todayDate] = {};
    }

    if (db.data.habits_status[user.id].custom_completions[todayDate][task.id]) {
      return res.json({
        code: 200,
        message: `今日已完成「${task.title}」打卡，未重複給點`,
        data: { duplicate: true, task_id: task.id }
      });
    }

    const pointsReward = Math.max(0, Number(task.points_reward ?? 1));
    const dewReward = Math.max(0, Number(task.dew_reward ?? 1));
    const idempotencyKey = `CUSTOM-HABIT-${user.id}-${task.id}-${todayDate}`;
    let newBalance = db.getUserBalance(user.id);

    if (pointsReward > 0) {
      const ledgerResult = db.addLedgerEntry({
        userId: user.id,
        transactionType: 'EARN_CUSTOM_HABIT',
        points: pointsReward,
        idempotencyKey,
        sourceRefId: task.id,
        notes: `日常修養任務打卡入點 (${task.category}・${task.title})`
      });
      newBalance = ledgerResult.newBalance;
    }
    if (dewReward > 0) {
      db.addDew(user.id, dewReward);
    }

    const completedAt = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    db.data.habits_status[user.id].custom_completions[todayDate][task.id] = {
      completedAt
    };
    db.save();

    return res.json({
      code: 200,
      message: `完成「${task.title}」！獲得 +${pointsReward} pt 與 +${dewReward} 露水`,
      data: {
        task_id: task.id,
        points_earned: pointsReward,
        dew_earned: dewReward,
        completed_at: completedAt,
        current_balance: newBalance
      }
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// 4.1 POS 蔬食辨識入點 Webhook
router.post('/pos-event', (req, res) => {
  try {
    const {
      terminal_id = 'POS-RESTAURANT-01',
      receipt_no = `REC-${Date.now()}`,
      card_uid = 'CARD-CSH-8821',
      date = new Date().toISOString().slice(0, 10),
      meal_name = '和風旬味蔬食便當'
    } = req.body;

    const user = db.getUserByCardUid(card_uid) || db.getUser(req.user?.id);
    const idempotencyKey = `POS-${terminal_id}-${receipt_no}-${date}`;
    const dailyKey = `POS-DAILY-${user.id}-${date}`;

    // Check if user already claimed today's vegetarian reward
    const alreadyClaimed = db.data.point_ledger.some(l => l.idempotency_key === dailyKey);

    if (alreadyClaimed) {
      db.addHardwareLog({
        source: 'POS_RESTAURANT',
        rawPayload: req.body,
        status: 'DUPLICATE_IGNORED',
        message: `員工 ${user.name} (${user.employee_no}) 今日已領取過蔬食點數，已忽略重複發放。`
      });

      return res.json({
        code: 200,
        message: '今日已完成蔬食打卡，未重複扣給點數',
        data: {
          duplicate: true,
          employee_no: user.employee_no,
          name: user.name
        }
      });
    }

    // Award configured points and dew drop for vegetarian meal
    const { pointsReward: vegePoints, dewReward: vegeDew } = getConfiguredHabitRewards('VEGETARIAN', 1, 1);
    let newBalance = db.getUserBalance(user.id);
    if (vegePoints > 0) {
      const ledgerResult = db.addLedgerEntry({
        userId: user.id,
        transactionType: 'EARN_VEGETARIAN',
        points: vegePoints,
        idempotencyKey: dailyKey,
        sourceRefId: receipt_no,
        notes: `員工餐廳週二蔬食日刷卡入點 (${meal_name})`
      });
      newBalance = ledgerResult.newBalance;
    }

    if (vegeDew > 0) {
      db.addDew(user.id, vegeDew);
    }

    if (!db.data.habits_status[user.id]) {
      db.data.habits_status[user.id] = {};
    }
    db.data.habits_status[user.id].vegetarian_today = true;
    db.data.habits_status[user.id].vegetarian_time = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    db.save();

    db.addHardwareLog({
      source: 'POS_RESTAURANT',
      rawPayload: req.body,
      status: 'SUCCESS',
      message: `【POS 結帳感應】員工 ${user.name} (${user.employee_no}) 享用蔬食，點數 +${vegePoints}，露水 +${vegeDew}`
    });

    // Simulated LINE Messaging API Push
    db.addNotification({
      title: 'LINE 智慧通知・蔬食入點',
      message: `午安，${user.name}！今日午間蔬食已靜靜入帳 (+${vegePoints} pt)，為庭園若竹添得一份甘露。`,
      type: 'vege'
    });

    return res.json({
      code: 200,
      message: '蔬食刷卡入點成功',
      data: {
        employee_no: user.employee_no,
        name: user.name,
        points_earned: vegePoints,
        dew_earned: vegeDew,
        current_balance: newBalance
      }
    });
  } catch (err) {
    db.addHardwareLog({
      source: 'POS_RESTAURANT',
      rawPayload: req.body,
      status: 'FAILED',
      message: err.message
    });
    return res.status(400).json({ code: 400, message: err.message });
  }
});

// 4.2a 產製或取得體能教室運動項目進場 QR Code
router.post('/gym-entry-qr', (req, res) => {
  try {
    const requestedCardUid = req.body?.card_uid;
    const requestedSportId = req.body?.sport_id;
    const user = (requestedCardUid ? db.getUserByCardUid(requestedCardUid) : null) || db.getUser(req.user?.id);
    if (!user) {
      return res.status(404).json({ code: 404, message: '查無對應員工識別證資料' });
    }

    const cardUid = requestedCardUid || user.card_uid || `CARD-${user.employee_no}`;

    // If sport_id is specified, return the sport item's dedicated QR Code
    if (requestedSportId) {
      const sport = (db.data.sport_items || []).find(s => s.id === requestedSportId);
      if (!sport || sport.is_active === false) {
        return res.status(404).json({ code: 404, message: '找不到該啟用中之運動項目' });
      }
      const enriched = db.enrichSportItem(sport, user.id);
      return res.json({
        code: 200,
        message: `已取得「${enriched.name}」專屬門禁 QR Code`,
        data: {
          qr_code: enriched.qr_code,
          gate_id: enriched.location || 'GYM-GATE-01',
          sport_id: enriched.id,
          sport_name: enriched.name,
          usage_mode: enriched.usage_mode,
          daily_limit: enriched.daily_limit,
          user_today_usage: enriched.user_today_usage || 0,
          active_users_count: enriched.active_users_count,
          occupied_by: enriched.occupied_by,
          is_dedicated_sport_qr: true,
          card_uid: cardUid,
          employee_name: user.name
        }
      });
    }

    if (!db.data.gym_qr_tokens) {
      db.data.gym_qr_tokens = {};
    }

    // Purge expired tokens older than 1 hour to keep storage tidy
    const cutoff = Date.now() - 60 * 60 * 1000;
    for (const [code, token] of Object.entries(db.data.gym_qr_tokens)) {
      if (new Date(token.created_at).getTime() < cutoff) {
        delete db.data.gym_qr_tokens[code];
      }
    }

    const qrCode = `CSH-GYM-QR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString();

    db.data.gym_qr_tokens[qrCode] = {
      qr_code: qrCode,
      card_uid: cardUid,
      user_id: user.id,
      employee_no: user.employee_no,
      gate_id: 'GYM-GATE-01',
      used: false,
      expires_at: expiresAt,
      created_at: now.toISOString()
    };
    db.save();

    return res.json({
      code: 200,
      message: '體能教室門禁進場 QR Code 已產製',
      data: {
        qr_code: qrCode,
        gate_id: 'GYM-GATE-01',
        is_dedicated_sport_qr: false,
        card_uid: cardUid,
        employee_name: user.name,
        expires_at: expiresAt
      }
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// 4.2b 取得啟用中之運動項目清單 (含專屬 QR Code、即時佔用狀態與當日使用次數)
router.get('/sports', (req, res) => {
  const list = (db.data.sport_items || [])
    .filter(s => s.is_active !== false)
    .map(s => db.enrichSportItem(s, req.user?.id || null));
  return res.json({
    code: 200,
    message: 'success',
    data: list
  });
});

// 4.2 體能教室門禁刷卡機 Webhook (Check-in with QR scan / concurrency check and Check-out)
router.post('/gym-access', (req, res) => {
  try {
    const {
      card_uid = 'CARD-CSH-8821',
      action = 'TOGGLE', // 'ENTRY', 'EXIT', or 'TOGGLE'
      entry_method = 'RFID', // 'QR_SCAN' | 'RFID'
      qr_code = null,
      sport_id = null,
      force_duration_mins = 35 // for simulation of 30+ mins workout
    } = req.body;

    const user = db.getUserByCardUid(card_uid) || db.getUser(req.user?.id);
    const session = db.data.gym_sessions[card_uid];
    const now = new Date();

    // Determine if Entry or Exit
    let actualAction = action;
    if (action === 'TOGGLE') {
      actualAction = session ? 'EXIT' : 'ENTRY';
    }

    if (actualAction === 'ENTRY') {
      if (session) {
        return res.status(400).json({
          code: 400,
          message: `您目前已在「${session.sport_name || '體能教室'}」運動中，請先刷退後再進場`
        });
      }

      const requiresQrVerification = entry_method === 'QR_SCAN' || Boolean(qr_code);
      const trimmedQr = qr_code ? String(qr_code).trim() : '';
      let matchedSportByQr = null;

      if (requiresQrVerification) {
        const normalizedQr = trimmedQr.toUpperCase();
        const sportMatch = normalizedQr
          ? (db.data.sport_items || []).find(s => (s.qr_code || '').toUpperCase() === normalizedQr)
          : null;

        if (sportMatch) {
          if (sportMatch.is_active === false) {
            db.addHardwareLog({
              source: 'GYM_DOOR_ENTRY',
              rawPayload: { card_uid, entry_method: 'QR_SCAN', qr_code: trimmedQr },
              status: 'QR_DISABLED',
              message: `【體能教室進場失敗】${user.name} 掃描之「${sportMatch.name}」目前已停用。`
            });
            return res.status(400).json({
              code: 400,
              message: `「${sportMatch.name}」目前已停用，無法掃碼進場`
            });
          }
          matchedSportByQr = sportMatch;
        } else {
          const tokenRecord = trimmedQr ? db.data.gym_qr_tokens?.[trimmedQr] : null;
          const isExpired = !tokenRecord || new Date(tokenRecord.expires_at).getTime() < now.getTime();
          const isCardMismatch = tokenRecord && tokenRecord.card_uid !== card_uid;

          if (!tokenRecord || tokenRecord.used || isExpired || isCardMismatch) {
            db.addHardwareLog({
              source: 'GYM_DOOR_ENTRY',
              rawPayload: { card_uid, entry_method: 'QR_SCAN', qr_code: trimmedQr || null },
              status: 'QR_INVALID',
              message: `【體能教室進場失敗】${user.name} 門禁 QR Code 無效、已使用或已過期。`
            });
            return res.status(400).json({
              code: 400,
              message: '門禁 QR Code 無效、已使用或已過期，請確認掃碼內容'
            });
          }

          tokenRecord.used = true;
          tokenRecord.used_at = now.toISOString();
        }
      }

      const resolvedMethod = requiresQrVerification ? 'QR_SCAN' : 'RFID';
      const sportById = sport_id
        ? (db.data.sport_items || []).find(s => s.id === sport_id && s.is_active !== false)
        : null;
      const selectedSport = matchedSportByQr || sportById;

      // Enforce single-user vs multi-user concurrency setting
      if (selectedSport && selectedSport.usage_mode === 'SINGLE') {
        const activeOccupant = Object.values(db.data.gym_sessions || {}).find(
          s => s.sport_id === selectedSport.id && s.card_uid !== card_uid
        );
        if (activeOccupant) {
          db.addHardwareLog({
            source: 'GYM_DOOR_ENTRY',
            rawPayload: {
              card_uid,
              user: user.name,
              sport_id: selectedSport.id,
              sport_name: selectedSport.name,
              occupied_by: activeOccupant.user_name
            },
            status: 'OCCUPIED',
            message: `【體能教室進場受限】${user.name} 欲使用「${selectedSport.name}」（限單人），目前由 ${activeOccupant.user_name} 使用中。`
          });
          return res.status(409).json({
            code: 409,
            message: `「${selectedSport.name}」設定為同時間只能一人使用，目前正由 ${activeOccupant.user_name} 使用中，請稍候再試`
          });
        }
      }

      // Enforce per-user daily usage limit setting
      const todayDate = now.toISOString().slice(0, 10);
      const parsedDailyLimit = Number(selectedSport?.daily_limit);
      const dailyLimit = Number.isFinite(parsedDailyLimit) && parsedDailyLimit >= 0
        ? Math.round(parsedDailyLimit)
        : 1;
      if (selectedSport && dailyLimit > 0) {
        const usedToday = db.getUserSportDailyUsage(user.id, selectedSport.id, todayDate);
        if (usedToday >= dailyLimit) {
          db.addHardwareLog({
            source: 'GYM_DOOR_ENTRY',
            rawPayload: {
              card_uid,
              user: user.name,
              sport_id: selectedSport.id,
              sport_name: selectedSport.name,
              used_today: usedToday,
              daily_limit: dailyLimit
            },
            status: 'DAILY_LIMIT_EXCEEDED',
            message: `【體能教室進場受限】${user.name} 今日使用「${selectedSport.name}」已達上限 (${usedToday}/${dailyLimit} 次)。`
          });
          return res.status(400).json({
            code: 400,
            message: `「${selectedSport.name}」當日不得使用超過 ${dailyLimit} 次，您今日已使用 ${usedToday} 次`
          });
        }
      }

      const sportName = selectedSport?.name || '體能教室運動';
      const minDurationMins = selectedSport?.min_duration_mins ?? 30;
      const rewardPoints = selectedSport?.reward_points ?? 1;
      const rewardDew = selectedSport?.reward_dew ?? 1;
      const usageMode = selectedSport?.usage_mode || 'MULTI';

      // Start session
      db.data.gym_sessions[card_uid] = {
        card_uid,
        user_id: user.id,
        user_name: user.name,
        start_time: now.toISOString(),
        terminal: selectedSport?.location || 'GYM-GATE-ENTRANCE',
        entry_method: resolvedMethod,
        qr_code: requiresQrVerification ? trimmedQr : null,
        sport_id: selectedSport?.id || null,
        sport_name: sportName,
        usage_mode: usageMode,
        daily_limit: dailyLimit,
        min_duration_mins: minDurationMins,
        reward_points: rewardPoints,
        reward_dew: rewardDew
      };
      if (selectedSport) {
        db.incrementUserSportDailyUsage(user.id, selectedSport.id, todayDate);
      }
      db.save();

      db.addHardwareLog({
        source: 'GYM_DOOR_ENTRY',
        rawPayload: {
          card_uid,
          user: user.name,
          entry_method: resolvedMethod,
          sport_name: sportName,
          usage_mode: usageMode,
          ...(requiresQrVerification ? { qr_code: trimmedQr } : {})
        },
        status: 'SUCCESS',
        message: requiresQrVerification
          ? `【體能教室掃碼進場】${user.name} 刷卡並掃描專屬 QR (${trimmedQr}) 進行「${sportName}」，計時展開。`
          : `【體能教室進場】${user.name} 嗶卡入場進行「${sportName}」，計時展開。`
      });

      db.addNotification({
        title: '體能教室・運動計時展開',
        message: requiresQrVerification
          ? `您已完成刷卡與 QR Code 掃碼進場（${sportName}），運動滿 ${minDurationMins} 分鐘並刷退將可獲得健康點數 +${rewardPoints}。`
          : `您已進入體能教室（${sportName}），運動滿 ${minDurationMins} 分鐘並刷退將可獲得健康點數 +${rewardPoints}。`,
        type: 'info'
      });

      return res.json({
        code: 200,
        message: requiresQrVerification
          ? `刷卡與 QR Code 掃碼驗證成功（${sportName}），體能教室計時已啟動`
          : `體能教室進場打卡成功（${sportName}），計時已啟動`,
        data: {
          action: 'ENTRY',
          entry_method: resolvedMethod,
          qr_code: requiresQrVerification ? trimmedQr : null,
          sport_id: selectedSport?.id || null,
          sport_name: sportName,
          usage_mode: usageMode,
          start_time: now.toISOString(),
          employee_name: user.name
        }
      });
    } else {
      // Exit action
      if (!session) {
        return res.status(400).json({
          code: 400,
          message: '查無進場刷卡紀錄，請先刷卡進場'
        });
      }

      const requiredMins = session.min_duration_mins || 30;
      const rewardPoints = session.reward_points ?? 1;
      const rewardDew = session.reward_dew ?? 1;
      const sportName = session.sport_name || '體能教室運動';

      // Check duration
      const startTime = new Date(session.start_time);
      let durationMins = Math.round((now.getTime() - startTime.getTime()) / (1000 * 60));

      // Allow simulated override if real time passed is less
      if (force_duration_mins) {
        durationMins = Math.max(durationMins, Number(force_duration_mins));
      }

      delete db.data.gym_sessions[card_uid];
      db.save();

      if (durationMins < requiredMins) {
        db.addHardwareLog({
          source: 'GYM_DOOR_EXIT',
          rawPayload: { card_uid, durationMins, sport_name: sportName },
          status: 'DURATION_INSUFFICIENT',
          message: `【體能教室刷退】${user.name}（${sportName}）運動時間 ${durationMins} 分鐘，未滿 ${requiredMins} 分鐘，未核發點數。`
        });

        return res.json({
          code: 200,
          message: `運動時間為 ${durationMins} 分鐘（需滿 ${requiredMins} 分鐘），本次未核發點數`,
          data: {
            action: 'EXIT',
            durationMins,
            qualified: false
          }
        });
      }

      // Qualified: award sport points and dew
      const todayDate = now.toISOString().slice(0, 10);
      const idempotencyKey = `GYM-${user.id}-${todayDate}`;

      const alreadyAwarded = db.data.point_ledger.some(l => l.idempotency_key === idempotencyKey);
      let newBalance = db.getUserBalance(user.id);

      if (!alreadyAwarded) {
        const result = db.addLedgerEntry({
          userId: user.id,
          transactionType: 'EARN_SPORT',
          points: rewardPoints,
          idempotencyKey,
          sourceRefId: `GYM-${todayDate}`,
          notes: `${sportName}滿 ${durationMins} 分鐘健康達標入點`
        });
        newBalance = result.newBalance;
        if (rewardDew > 0) {
          db.addDew(user.id, rewardDew);
        }
      }

      if (!db.data.habits_status[user.id]) {
        db.data.habits_status[user.id] = {};
      }
      db.data.habits_status[user.id].gym_today = true;
      db.data.habits_status[user.id].gym_time = `${durationMins} 分鐘`;
      db.save();

      db.addHardwareLog({
        source: 'GYM_DOOR_EXIT',
        rawPayload: { card_uid, durationMins, sport_name: sportName },
        status: 'SUCCESS',
        message: `【體能教室刷退】${user.name} 完成「${sportName}」${durationMins} 分鐘，點數 +${rewardPoints}，露水 +${rewardDew}`
      });

      db.addNotification({
        title: 'LINE 智慧通知・行健有成',
        message: `恭喜 ${user.name} 完成 ${durationMins} 分鐘「${sportName}」！健康點數 +${rewardPoints} 已入帳。`,
        type: 'sport'
      });

      return res.json({
        code: 200,
        message: `運動達標！成功獲得健康點數 +${rewardPoints}，露水 +${rewardDew}`,
        data: {
          action: 'EXIT',
          sport_name: sportName,
          durationMins,
          qualified: true,
          points_earned: rewardPoints,
          dew_earned: rewardDew,
          current_balance: newBalance
        }
      });
    }
  } catch (err) {
    return res.status(400).json({ code: 400, message: err.message });
  }
});

// 4.3 HIS 健檢與癌症篩檢批次排程同步 Webhook
router.post('/his-sync', (req, res) => {
  try {
    const { batch_date = new Date().toISOString().slice(0, 10), sync_type = 'ALL' } = req.body;
    const user = db.getUser(req.user?.id);
    const currentYear = new Date().getFullYear();
    const idempotencyKey = `HIS-${user.id}-${currentYear}-${sync_type}`;

    const alreadySynced = db.data.point_ledger.some(l => l.idempotency_key === idempotencyKey);

    if (alreadySynced) {
      db.addHardwareLog({
        source: 'HIS_SCREENING_CRON',
        rawPayload: req.body,
        status: 'DUPLICATE_IGNORED',
        message: `【HIS 凌晨排程】同仁 ${user.name} ${currentYear} 年度健檢已同步完成，跳過重入。`
      });

      return res.json({
        code: 200,
        message: '本年度健檢點數已於日前核算入帳，未重複發放',
        data: { synced: false, reason: 'ALREADY_SYNCED' }
      });
    }

    // Award configured points for cancer screen / health checkup
    const { pointsReward: hisPoints, dewReward: hisDew } = getConfiguredHabitRewards('CHECKUP', 2, 2);
    let newBalance = db.getUserBalance(user.id);
    if (hisPoints > 0) {
      const ledgerResult = db.addLedgerEntry({
        userId: user.id,
        transactionType: 'EARN_CHECKUP',
        points: hisPoints,
        idempotencyKey,
        sourceRefId: `HIS-${currentYear}-ETL`,
        notes: `${currentYear} 年度全院常態體檢與四癌篩檢合格自動核算入帳`
      });
      newBalance = ledgerResult.newBalance;
    }

    if (hisDew > 0) {
      db.addDew(user.id, hisDew);
    }

    if (!db.data.habits_status[user.id]) {
      db.data.habits_status[user.id] = {};
    }
    db.data.habits_status[user.id].checkup_completed = true;
    db.data.habits_status[user.id].cancer_screen_completed = true;
    db.save();

    db.addHardwareLog({
      source: 'HIS_SCREENING_CRON',
      rawPayload: req.body,
      status: 'SUCCESS',
      message: `【HIS 凌晨排程】同仁 ${user.name} 健檢癌篩審核合格，點數 +${hisPoints}，露水 +${hisDew}`
    });

    db.addNotification({
      title: '檢驗科 HIS・健檢合格入帳',
      message: `您的年度健檢與四癌篩檢資料已成功對接，健康點數 +${hisPoints} 已入帳。`,
      type: 'checkup'
    });

    return res.json({
      code: 200,
      message: `HIS 資料同步完成！點數 +${hisPoints}，水滴露水 +${hisDew}`,
      data: {
        synced: true,
        points_earned: hisPoints,
        dew_earned: hisDew,
        current_balance: newBalance
      }
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
});

// GET /api/v1/integrations/logs - Live hardware integration logs
router.get('/logs', (req, res) => {
  return res.json({
    code: 200,
    message: 'success',
    data: db.data.raw_hardware_logs
  });
});

// GET /api/v1/integrations/notifications - Simulated LINE push messages
router.get('/notifications', (req, res) => {
  return res.json({
    code: 200,
    message: 'success',
    data: db.data.notifications
  });
});

export default router;

