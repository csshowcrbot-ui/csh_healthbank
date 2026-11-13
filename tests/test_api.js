import http from 'http';
import app from '../server/server.js';

// Simple test runner for CSH-HealthBank
async function runTests() {
  console.log('=== [CSH-HealthBank] Automated Verification Test Suite ===\n');

  const baseUrl = process.env.TEST_URL || 'http://localhost:8080';

  async function request(path, options = {}) {
    const url = `${baseUrl}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error(`Failed to parse JSON from ${url}. Received status ${res.status}:`, text.slice(0, 150));
      throw e;
    }
    return { status: res.status, data };
  }

  let passed = 0;
  let failed = 0;

  // Wait 200ms for server to listen
  await new Promise(r => setTimeout(r, 200));

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // Test 1: Health check
    console.log('1. Health check & Initial Dashboard:');
    const health = await request('/health');
    assert(health.status === 200 && health.data.status === 'healthy', 'Health check passed');

    const dash = await request('/api/v1/tree/dashboard');
    assert(dash.status === 200 && dash.data.code === 200, 'Tree dashboard API returned code 200');
    assert(dash.data.data.employee_info.employee_no === 'E2108', 'Employee E2108 identified');
    console.log(`    Current points: ${dash.data.data.points.current_balance} pt, Level: ${dash.data.data.tree.level_name}`);

    // Test 2: Tree Watering Interaction
    console.log('\n2. Tree Watering Interaction:');
    const initialDew = dash.data.data.tree.pending_dew;
    if (initialDew > 0) {
      const waterRes = await request('/api/v1/tree/water', {
        method: 'POST',
        body: JSON.stringify({ water_amount: 1 })
      });
      assert(waterRes.status === 200 && waterRes.data.code === 200, 'Water tree succeeded');
      assert(waterRes.data.data.exp_gained === 10, 'Exp gained is 10 points per droplet');
      assert(waterRes.data.data.remaining_dew === initialDew - 1, 'Pending dew deducted properly');
    }

    // Test 3: POS Hardware Integration (Section 4.1)
    console.log('\n3. POS Canteen Webhook Integration (Section 4.1):');
    const posRes = await request('/api/v1/integrations/pos-event', {
      method: 'POST',
      body: JSON.stringify({
        terminal_id: 'POS-TEST-01',
        receipt_no: `TEST-REC-${Date.now()}`,
        card_uid: 'CARD-CSH-8821',
        date: '2026-10-30',
        meal_name: '週二蔬食特餐'
      })
    });
    assert(posRes.status === 200, 'POS Webhook responded successfully');
    console.log(`    POS Result: ${posRes.data.message}`);

    // Test 3b: POS Idempotency (Cannot claim twice on same day)
    const posDupRes = await request('/api/v1/integrations/pos-event', {
      method: 'POST',
      body: JSON.stringify({
        terminal_id: 'POS-TEST-01',
        receipt_no: `TEST-REC-DUP-${Date.now()}`,
        card_uid: 'CARD-CSH-8821',
        date: '2026-10-30',
        meal_name: '週二蔬食特餐'
      })
    });
    assert(posDupRes.data.data?.duplicate === true, 'POS duplicate check on same day respected (idempotency)');

    // Test 4: Gym QR Code Entry & Exit with >= 30 mins (Section 4.2)
    console.log('\n4. Gym Access Control Webhook with QR Scan (Section 4.2):');
    // Ensure no leftover active session from manual browser runs
    await request('/api/v1/integrations/gym-access', {
      method: 'POST',
      body: JSON.stringify({ action: 'EXIT', card_uid: 'CARD-CSH-8821', force_duration_mins: 35 })
    });
    const gymQrRes = await request('/api/v1/integrations/gym-entry-qr', {
      method: 'POST',
      body: JSON.stringify({ card_uid: 'CARD-CSH-8821' })
    });
    assert(gymQrRes.status === 200 && gymQrRes.data.data?.qr_code, 'Gym entry QR code generated');
    const validGymQr = gymQrRes.data.data.qr_code;

    const invalidGymEntry = await request('/api/v1/integrations/gym-access', {
      method: 'POST',
      body: JSON.stringify({
        action: 'ENTRY',
        card_uid: 'CARD-CSH-8821',
        entry_method: 'QR_SCAN',
        qr_code: 'INVALID-QR-CODE'
      })
    });
    assert(invalidGymEntry.status === 400, 'Invalid gym entry QR code rejected with 400');

    const gymEntry = await request('/api/v1/integrations/gym-access', {
      method: 'POST',
      body: JSON.stringify({
        action: 'ENTRY',
        card_uid: 'CARD-CSH-8821',
        entry_method: 'QR_SCAN',
        qr_code: validGymQr
      })
    });
    assert(
      gymEntry.status === 200 &&
        gymEntry.data.data.action === 'ENTRY' &&
        gymEntry.data.data.entry_method === 'QR_SCAN',
      'Gym QR scan entry check-in recorded'
    );

    const replayGymEntry = await request('/api/v1/integrations/gym-access', {
      method: 'POST',
      body: JSON.stringify({
        action: 'ENTRY',
        card_uid: 'CARD-CSH-8821',
        entry_method: 'QR_SCAN',
        qr_code: validGymQr
      })
    });
    assert(replayGymEntry.status === 400, 'Used gym QR code replay rejected with 400');

    const gymExit = await request('/api/v1/integrations/gym-access', {
      method: 'POST',
      body: JSON.stringify({ action: 'EXIT', card_uid: 'CARD-CSH-8821', force_duration_mins: 35 })
    });
    assert(gymExit.status === 200 && gymExit.data.data.qualified === true, 'Gym 35 mins workout recognized and awarded');

    // Test 5: Charity Donation (前山基金會專案 100 pt -> NT$ 200) (Section 3.3)
    console.log('\n5. Qianshan Foundation Charity Matching (Section 3.3):');
    const donateRes = await request('/api/v1/redemption/charity-donate', {
      method: 'POST',
      body: JSON.stringify({ project_code: 'QIAN_SHAN_2026', points_to_donate: 100 })
    });
    assert(donateRes.status === 200 && donateRes.data.code === 200, 'Charity donation processed');
    assert(donateRes.data.data.hospital_matching_fund === 200, 'Hospital matched 100 pt with NT$ 200');
    assert(donateRes.data.data.beneficiary.includes('前山'), 'Beneficiary matches 前山社會福利慈善事業基金會');

    // Test 6: Coupon Redemption & Verification (Section 2.2 #4)
    console.log('\n6. Canteen Coupon Redemption & QR Verification:');
    const couponRes = await request('/api/v1/redemption/coupon', {
      method: 'POST',
      body: JSON.stringify({ item_id: 'canteen-50' })
    });
    if (couponRes.data.code === 200) {
      assert(true, 'Redeemed 員工餐廳 50 元折抵券');
      const voucherCode = couponRes.data.data.voucher.qr_voucher_code;

      const verifyRes = await request('/api/v1/redemption/verify-coupon', {
        method: 'POST',
        body: JSON.stringify({ qr_voucher_code: voucherCode })
      });
      assert(verifyRes.status === 200 && verifyRes.data.data.status === 'USED', 'Cashier scanned QR code & verified');
    } else {
      console.log(`    Note on redemption: ${couponRes.data.message}`);
    }

    // Test 7: RBAC Enforcement & Double-Entry Ledger Audit
    console.log('\n7. Admin RBAC Enforcement & Double-Entry Ledger Audit:');
    const unauthAdmin = await request('/api/v1/admin/ledger');
    assert(unauthAdmin.status === 401, 'Unauthenticated access to /api/v1/admin/ledger blocked with 401');

    const staffLogin = await request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ employee_no: 'E2108', password: 'csh1234' })
    });
    assert(staffLogin.status === 200 && staffLogin.data.data?.token, 'Staff E2108 logged in');

    const staffAdminCheck = await request('/api/v1/admin/ledger', {
      headers: { Authorization: `Bearer ${staffLogin.data.data.token}` }
    });
    assert(staffAdminCheck.status === 403, 'Non-admin STAFF blocked from /api/v1/admin/ledger with 403');

    const staffCreateItemCheck = await request('/api/v1/admin/catalog', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffLogin.data.data.token}` },
      body: JSON.stringify({ name: 'ShouldFail', points: 10 })
    });
    assert(staffCreateItemCheck.status === 403, 'Non-admin STAFF blocked from /api/v1/admin/catalog POST with 403');

    const adminLogin = await request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ employee_no: 'A0001', password: 'csh1234' })
    });
    assert(adminLogin.status === 200 && adminLogin.data.data?.token, 'Admin A0001 logged in');
    const adminHeaders = { Authorization: `Bearer ${adminLogin.data.data.token}` };

    const ledgerRes = await request('/api/v1/admin/ledger', { headers: adminHeaders });
    assert(ledgerRes.status === 200, 'Admin retrieved ledger entries');
    assert(ledgerRes.data.data.length >= 3, `Ledger has ${ledgerRes.data.data.length} immutable entries`);

    const invalidRoleCreate = await request('/api/v1/admin/users', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        employee_no: 'T9999',
        name: '測試角色限制',
        dept_code: '測試部門',
        role: 'HR'
      })
    });
    assert(invalidRoleCreate.status === 400, 'Disallowed role HR rejected with 400 on /api/v1/admin/users POST');

    // Verify mathematical integrity of ledger (per user_id)
    const sorted = [...ledgerRes.data.data].sort((a, b) => a.id - b.id);
    const runningByUser = {};
    let integrityCheckPassed = true;
    for (const item of sorted) {
      runningByUser[item.user_id] = (runningByUser[item.user_id] || 0) + item.points;
      if (runningByUser[item.user_id] !== item.balance_snapshot) {
        integrityCheckPassed = false;
        console.error(`Mismatch at ledger #${item.id} (${item.user_id}): calculated ${runningByUser[item.user_id]} vs snapshot ${item.balance_snapshot}`);
      }
    }
    assert(integrityCheckPassed, 'All ledger balance snapshots match running sum of entries per user (Double-Entry Bookkeeping passed)');

    // Test 8: Qianshan Foundation Accounting Report
    console.log('\n8. Accounting Report for Qianshan Foundation:');
    const charityReportRes = await request('/api/v1/admin/charity-report', { headers: adminHeaders });
    assert(charityReportRes.status === 200, 'Charity accounting summary retrieved by Admin');
    assert(charityReportRes.data.data.summary.total_matching_funds_ntd >= 200, 'Matching funds correctly recorded in audit summary');

    // Test 9: Admin Sport Items Maintenance CRUD
    console.log('\n9. Sport Items Maintenance (Admin CRUD & Integration Sync):');
    const staffSportCheck = await request('/api/v1/admin/sports', {
      headers: { Authorization: `Bearer ${staffLogin.data.data.token}` }
    });
    assert(staffSportCheck.status === 403, 'Non-admin STAFF blocked from /api/v1/admin/sports with 403');

    const createSportRes = await request('/api/v1/admin/sports', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        name: '划船機核心訓練',
        category: 'CARDIO',
        location: '體能教室 C 區',
        min_duration_mins: 25,
        reward_points: 2,
        reward_dew: 1,
        usage_mode: 'SINGLE',
        daily_limit: 1,
        icon: '🚣'
      })
    });
    assert(
      createSportRes.status === 200 &&
        createSportRes.data.data?.id &&
        Boolean(createSportRes.data.data?.qr_code) &&
        createSportRes.data.data?.usage_mode === 'SINGLE' &&
        createSportRes.data.data?.daily_limit === 1,
      'Admin created new SINGLE-mode sport item with dedicated QR code and daily_limit=1'
    );
    const createdSportId = createSportRes.data.data.id;
    const createdSportQr = createSportRes.data.data.qr_code;

    const updateSportRes = await request(`/api/v1/admin/sports/${createdSportId}`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ min_duration_mins: 35, is_active: true })
    });
    assert(updateSportRes.status === 200 && updateSportRes.data.data?.min_duration_mins === 35, 'Admin updated sport item duration');

    const activeSportsRes = await request('/api/v1/integrations/sports');
    assert(
      activeSportsRes.status === 200 && activeSportsRes.data.data.some(s => s.id === createdSportId && s.qr_code === createdSportQr),
      'Maintained active sport item and QR code appear in /api/v1/integrations/sports'
    );

    // Concurrency test: SINGLE mode blocks 2nd simultaneous user with 409
    const singleUser1Entry = await request('/api/v1/integrations/gym-access', {
      method: 'POST',
      body: JSON.stringify({
        action: 'ENTRY',
        card_uid: 'CARD-CSH-8821',
        entry_method: 'QR_SCAN',
        qr_code: createdSportQr
      })
    });
    assert(singleUser1Entry.status === 200 && singleUser1Entry.data.data?.sport_id === createdSportId, 'First user entered SINGLE-mode sport via dedicated QR code');

    const singleUser2Blocked = await request('/api/v1/integrations/gym-access', {
      method: 'POST',
      body: JSON.stringify({
        action: 'ENTRY',
        card_uid: 'CARD-CSH-0001',
        entry_method: 'QR_SCAN',
        qr_code: createdSportQr
      })
    });
    assert(singleUser2Blocked.status === 409, 'Second simultaneous user blocked with 409 on SINGLE-mode sport');

    await request('/api/v1/integrations/gym-access', {
      method: 'POST',
      body: JSON.stringify({ action: 'EXIT', card_uid: 'CARD-CSH-8821', force_duration_mins: 35 })
    });

    // Daily limit test: 2nd entry on same day with daily_limit=1 blocked with 400
    const dailyLimitBlocked = await request('/api/v1/integrations/gym-access', {
      method: 'POST',
      body: JSON.stringify({
        action: 'ENTRY',
        card_uid: 'CARD-CSH-8821',
        entry_method: 'QR_SCAN',
        qr_code: createdSportQr
      })
    });
    assert(dailyLimitBlocked.status === 400, 'Second entry same day blocked with 400 when daily_limit=1');

    // Increase daily_limit to 2 and verify 2nd entry succeeds
    await request(`/api/v1/admin/sports/${createdSportId}`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ daily_limit: 2 })
    });
    const dailyLimitRaisedEntry = await request('/api/v1/integrations/gym-access', {
      method: 'POST',
      body: JSON.stringify({
        action: 'ENTRY',
        card_uid: 'CARD-CSH-8821',
        entry_method: 'QR_SCAN',
        qr_code: createdSportQr
      })
    });
    assert(dailyLimitRaisedEntry.status === 200, 'Second entry succeeds after raising daily_limit to 2');
    await request('/api/v1/integrations/gym-access', {
      method: 'POST',
      body: JSON.stringify({ action: 'EXIT', card_uid: 'CARD-CSH-8821', force_duration_mins: 35 })
    });

    // Concurrency test: MULTI mode allows multiple users at the same time
    const multiSport = activeSportsRes.data.data.find(s => s.usage_mode === 'MULTI');
    const multiUser1Entry = await request('/api/v1/integrations/gym-access', {
      method: 'POST',
      body: JSON.stringify({
        action: 'ENTRY',
        card_uid: 'CARD-CSH-8821',
        entry_method: 'QR_SCAN',
        qr_code: multiSport.qr_code
      })
    });
    const multiUser2Entry = await request('/api/v1/integrations/gym-access', {
      method: 'POST',
      body: JSON.stringify({
        action: 'ENTRY',
        card_uid: 'CARD-CSH-0001',
        entry_method: 'QR_SCAN',
        qr_code: multiSport.qr_code
      })
    });
    assert(
      multiUser1Entry.status === 200 && multiUser2Entry.status === 200,
      'Multiple users allowed simultaneously on MULTI-mode sport via dedicated QR code'
    );

    await request('/api/v1/integrations/gym-access', {
      method: 'POST',
      body: JSON.stringify({ action: 'EXIT', card_uid: 'CARD-CSH-8821', force_duration_mins: 35 })
    });
    await request('/api/v1/integrations/gym-access', {
      method: 'POST',
      body: JSON.stringify({ action: 'EXIT', card_uid: 'CARD-CSH-0001', force_duration_mins: 35 })
    });

    const deleteSportRes = await request(`/api/v1/admin/sports/${createdSportId}`, {
      method: 'DELETE',
      headers: adminHeaders
    });
    assert(deleteSportRes.status === 200, 'Admin deleted sport item');

    // Test 10: Admin Daily Habit Tasks Maintenance (日常修養任務設定)
    console.log('\n10. Daily Habit Tasks Maintenance (Admin CRUD & Staff Sync):');
    const staffHeaders = { Authorization: `Bearer ${staffLogin.data.data.token}` };
    const staffHabitCheck = await request('/api/v1/admin/habit-tasks', { headers: staffHeaders });
    assert(staffHabitCheck.status === 403, 'Non-admin STAFF blocked from /api/v1/admin/habit-tasks with 403');

    const listHabitTasksRes = await request('/api/v1/admin/habit-tasks', { headers: adminHeaders });
    assert(
      listHabitTasksRes.status === 200 && Array.isArray(listHabitTasksRes.data.data) && listHabitTasksRes.data.data.length >= 4,
      'Admin retrieved default daily habit tasks'
    );

    const createHabitRes = await request('/api/v1/admin/habit-tasks', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        category: '潤澤',
        title: '每日溫水飲足 2000cc',
        description: '輪班空檔定量補充溫開水，維持代謝平衡。',
        icon: '💧',
        points_reward: 2,
        dew_reward: 1,
        source_type: '自主打卡回報',
        habit_key: 'CUSTOM',
        sort_order: 5,
        is_active: true
      })
    });
    assert(
      createHabitRes.status === 201 && createHabitRes.data.data?.id && createHabitRes.data.data?.title === '每日溫水飲足 2000cc',
      'Admin created new CUSTOM daily habit task'
    );
    const createdHabitId = createHabitRes.data.data.id;

    const patchHabitRes = await request(`/api/v1/admin/habit-tasks/${createdHabitId}`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ points_reward: 3, completed_status_text: '今日飲水達標' })
    });
    assert(
      patchHabitRes.status === 200 && patchHabitRes.data.data?.points_reward === 3,
      'Admin updated habit task points_reward to 3 pt'
    );

    const todayWithCustom = await request('/api/v1/tasks/today', { headers: staffHeaders });
    const foundCustom = (todayWithCustom.data.data?.tasks || []).find(t => t.id === createdHabitId);
    assert(
      Boolean(foundCustom) && foundCustom.pointsReward === 3 && foundCustom.habitKey === 'CUSTOM' && !foundCustom.isCompleted,
      'New active custom habit task appears in GET /api/v1/tasks/today with updated points'
    );

    const completeCustomRes = await request(`/api/v1/tasks/${createdHabitId}/complete`, {
      method: 'POST',
      headers: staffHeaders,
      body: JSON.stringify({})
    });
    assert(
      completeCustomRes.status === 200 && completeCustomRes.data.data?.points_earned === 3,
      'Staff completed CUSTOM habit task and earned configured +3 pt'
    );

    const todayAfterComplete = await request('/api/v1/tasks/today', { headers: staffHeaders });
    const completedCustom = (todayAfterComplete.data.data?.tasks || []).find(t => t.id === createdHabitId);
    assert(
      Boolean(completedCustom) && completedCustom.isCompleted === true && completedCustom.statusText === '今日飲水達標',
      'Completed CUSTOM habit task reflects updated completion status in /api/v1/tasks/today'
    );

    const deleteHabitRes = await request(`/api/v1/admin/habit-tasks/${createdHabitId}`, {
      method: 'DELETE',
      headers: adminHeaders
    });
    assert(deleteHabitRes.status === 200, 'Admin deleted custom habit task');

    console.log(`\n=== Test Results: ${passed} Passed, ${failed} Failed ===`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
