<template>
  <!-- Login View when unauthenticated -->
  <LoginView v-if="!isAuthenticated" @login-success="handleLoginSuccess" />

  <!-- Admin Management Platform View (Strictly ADMIN only) -->
  <AdminDashboard
    v-else-if="appMode === 'admin' && isAdmin"
    :current-user="currentUser || dashboard.employee_info"
    @back-to-frontend="appMode = 'liff'; refreshAll()"
    @logout="handleLogout"
    @data-updated="refreshAll"
  />

  <div v-else class="min-h-screen washi-pattern text-sumikuro flex justify-center pb-24 md:pb-12 antialiased">
    <!-- Main Mobile Container (LINE LIFF Viewport Style) -->
    <main class="w-full max-w-md bg-washi min-h-screen flex flex-col shadow-2xl relative border-x border-shiraki-dark/50">

      <!-- TOP APP BAR -->
      <header class="sticky top-0 z-30 bg-washi/90 backdrop-blur-md px-4 py-3 border-b border-shiraki-dark flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-xl">🌿</span>
          <div>
            <h1 class="font-serif font-bold text-sm tracking-wide text-sumikuro">竹山秀傳・健康銀行</h1>
            <p class="text-[11px] text-chausu font-serif">
              午安，{{ dashboard.employee_info?.name || '小嵐' }}
              <span class="text-[10px] bg-shiraki px-1.5 py-0.2 rounded border border-shiraki-dark ml-1">
                {{ dashboard.employee_info?.dept_name || '急診護理部' }}
              </span>
            </p>
          </div>
        </div>

        <!-- Header Actions -->
        <div class="flex items-center gap-1.5">
          <!-- Notification Bell -->
          <button
            @click="isNotificationOpen = true"
            class="relative p-2 text-chausu hover:text-sumikuro rounded-full hover:bg-shiraki transition-colors"
            title="LINE 訊息推播"
          >
            <span class="text-base">🔔</span>
            <span
              v-if="unreadNotificationsCount > 0"
              class="absolute top-1 right-1 w-2 h-2 rounded-full bg-nadeshiko"
            ></span>
          </button>

          <!-- Edge Hardware Simulator Button -->
          <button
            @click="isEdgeSimulatorOpen = true"
            class="px-2 py-1 text-[11px] font-serif bg-shiraki hover:bg-shiraki-dark text-sumikuro rounded-pill border border-shiraki-dark transition-colors flex items-center gap-1"
            title="院內實體系統介接中台"
          >
            <span>🛠️</span>
            <span class="hidden sm:inline">刷卡中台</span>
          </button>

          <!-- Admin Management Platform Button (Visible only to ADMIN) -->
          <button
            v-if="isAdmin"
            @click="appMode = 'admin'"
            class="px-2 py-1 text-[11px] font-serif bg-sumikuro hover:bg-gray-800 text-white rounded-pill transition-colors flex items-center gap-1"
            title="開啟後端管理平台（會員 / 日嚐好物 / 稽核）"
          >
            <span>📊</span>
            <span class="hidden sm:inline">管理平台</span>
          </button>

          <!-- Logout / Switch Account Button -->
          <button
            @click="handleLogout"
            class="px-2 py-1 text-[11px] font-serif bg-white hover:bg-shiraki text-chausu hover:text-sumikuro rounded-pill border border-shiraki-dark transition-colors"
            title="登出 / 切換帳號"
          >
            登出
          </button>
        </div>
      </header>

      <!-- VIEW 1: 🌿「庭園」(Garden Home View) -->
      <section v-if="activeTab === 'garden'" class="flex-1 p-4 space-y-4">
        <!-- Poetry / Motto -->
        <div class="text-center pt-2">
          <p class="font-serif text-xs tracking-[0.25em] text-chausu">
            一 滴 一 葉 ， 日 常 滋 養
          </p>
        </div>

        <!-- Japanese Zen Garden Tree -->
        <div class="bg-white rounded-2xl border border-shiraki-dark shadow-zen p-4">
          <ZenGardenTree
            :level-info="treeLevelInfo"
            :pending-dew="dashboard.tree?.pending_dew || 0"
            @water="handleWater"
          />
        </div>

        <!-- Point Asset Card (點數資產帳本) -->
        <div class="bg-white rounded-2xl border border-shiraki-dark shadow-zen p-4 text-sumikuro">
          <div class="flex items-center justify-between text-xs text-chausu font-serif pb-2 border-b border-shiraki-dark">
            <span class="flex items-center gap-1">
              <span>🪙</span> 點數資產帳本
            </span>
            <span class="text-[10px] bg-emerald-50 text-wakatake font-sans px-2 py-0.5 rounded-full border border-emerald-200">
              ● 自動感應已同步
            </span>
          </div>

          <div class="pt-3 grid grid-cols-2 divide-x divide-shiraki-dark">
            <div class="pr-3">
              <span class="text-[11px] text-chausu font-serif">當前健康點數</span>
              <div class="flex items-baseline gap-1 mt-0.5">
                <span class="text-3xl font-bold font-number text-wakatake">
                  {{ dashboard.points?.current_balance || 0 }}
                </span>
                <span class="text-xs text-chausu font-serif">pt</span>
              </div>
              <span class="text-[10px] text-chausu block mt-1">10 pt 換 10 元福利折抵</span>
            </div>

            <div class="pl-4">
              <span class="text-[11px] text-chausu font-serif">等值生活金</span>
              <div class="flex items-baseline gap-1 mt-0.5">
                <span class="text-2xl font-bold font-number text-sumikuro">
                  NT$ {{ dashboard.points?.cash_equivalent || 0 }}
                </span>
              </div>
              <span class="text-[10px] text-chausu block mt-1">員工餐廳與好物無上限抵用</span>
            </div>
          </div>
        </div>

        <!-- Qianshan Foundation Warm Card (前山基金會加倍代捐) -->
        <div class="bg-gradient-to-br from-[#FFF9F8] to-[#FAF2EF] rounded-2xl border border-nadeshiko/20 shadow-zen p-4 relative overflow-hidden">
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <div class="flex items-center gap-1.5 text-xs font-serif font-bold text-nadeshiko">
                <span>❦</span> 溫暖共好・前山基金會
              </div>
              <p class="text-xs text-sumikuro/90 leading-relaxed font-serif">
                累積滿 100 點，醫院為您化作 <span class="font-bold text-nadeshiko">NT$ 200</span> 愛心代捐
              </p>
              <p class="text-[10px] text-chausu">
                配對倍增捐助南投在地長者照護與弱勢扶助
              </p>
            </div>
            <!-- Hanko Seal Preview -->
            <div class="hanko-stamp-round w-11 h-11 text-[8px] flex-col border-nadeshiko text-nadeshiko scale-90">
              <span>倍增</span>
              <span>代捐</span>
            </div>
          </div>

          <div class="mt-3">
            <button
              @click="handleCharityClick"
              class="w-full py-2 bg-nadeshiko hover:bg-nadeshiko-dark text-white rounded-pill text-xs font-serif shadow-sm transition-all flex items-center justify-center gap-1 active:scale-98"
            >
              <span>轉讓 100 點作公益 ➔</span>
            </button>
          </div>
        </div>

        <!-- Today's Rhythm Quick Status (今日修養節奏) -->
        <div class="bg-white rounded-2xl border border-shiraki-dark shadow-zen p-4">
          <div class="flex items-center justify-between text-xs font-serif font-bold text-sumikuro mb-3">
            <span class="flex items-center gap-1">
              <span>🌿</span> 今日修養節奏
            </span>
            <button @click="activeTab = 'habits'" class="text-[11px] text-wakatake font-normal hover:underline">
              查看全部 ➔
            </button>
          </div>

          <div class="space-y-2 text-xs font-serif">
            <div
              v-for="task in todayTasks.slice(0, 2)"
              :key="task.id"
              class="flex items-center justify-between p-2.5 rounded-xl bg-shiraki-light border border-shiraki-dark"
            >
              <div class="flex items-center gap-2">
                <span class="text-sm">{{ task.icon || (task.category === '日嚐' ? '🥗' : '🌿') }}</span>
                <div>
                  <div class="font-bold text-sumikuro">{{ task.title }}</div>
                  <div class="text-[10px] text-chausu">{{ task.statusText }}</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-mono text-wakatake font-bold text-xs">+{{ task.pointsReward }} pt</span>
                <span
                  v-if="task.isCompleted"
                  class="hanko-stamp px-1.5 py-0.5 text-[9px] text-nadeshiko border-nadeshiko"
                >
                  済
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- VIEW 2: 📋「修養」(Habits & Tasks View) -->
      <section v-else-if="activeTab === 'habits'" class="flex-1 p-4 space-y-4">
        <!-- Header -->
        <div class="pb-2">
          <h2 class="font-serif text-base font-bold text-sumikuro tracking-wide">
            ・食・動の習慣 ・ 日常修養
          </h2>
          <p class="text-xs text-chausu font-serif mt-0.5">
            「日日微小的累積，皆是生命的厚度。」
          </p>
        </div>

        <!-- 4 Japanese Habit Cards -->
        <div class="space-y-3">
          <div
            v-for="(task, index) in todayTasks"
            :key="task.id"
            class="bg-white p-4 rounded-2xl border border-shiraki-dark shadow-zen relative overflow-hidden transition-all hover:border-wakatake/50"
          >
            <!-- Watermark / Stamp if completed -->
            <div
              v-if="task.isCompleted"
              class="absolute right-3 top-3 hanko-stamp w-12 h-12 text-xs flex-col text-nadeshiko border-nadeshiko pointer-events-none"
            >
              <span>達成</span>
              <span>済</span>
            </div>

            <div class="flex items-center gap-2 mb-1.5">
              <span class="text-xs font-serif font-bold px-2 py-0.5 rounded bg-shiraki text-wakatake-dark border border-shiraki-dark">
                {{ formatHabitBadge(task, index) }}
              </span>
              <h3 class="font-serif font-bold text-sm text-sumikuro">
                {{ task.title }}
              </h3>
            </div>

            <p class="text-xs text-chausu leading-relaxed font-serif mb-3 pr-10">
              {{ task.description }}
            </p>

            <div class="pt-2 border-t border-shiraki-dark/60 flex items-center justify-between text-xs">
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] text-chausu">狀態：</span>
                <span
                  class="font-semibold text-xs"
                  :class="task.isCompleted ? 'text-wakatake' : 'text-chausu'"
                >
                  {{ task.statusText }}
                </span>
                <span v-if="task.completedAt" class="text-[10px] text-chausu">
                  ({{ task.completedAt }})
                </span>
              </div>

              <div class="flex items-center gap-2">
                <span class="font-mono text-wakatake font-bold">+{{ task.pointsReward }} pt</span>
                <button
                  v-if="!task.isCompleted && task.habitKey === 'CUSTOM'"
                  @click="completeCustomTask(task)"
                  class="px-2.5 py-1 bg-wakatake hover:bg-wakatake-dark text-white rounded-pill text-[11px] font-serif transition-colors"
                >
                  完成打卡 ✓
                </button>
                <button
                  v-else-if="!task.isCompleted"
                  @click="isEdgeSimulatorOpen = true"
                  class="px-2.5 py-1 bg-shiraki hover:bg-shiraki-dark text-sumikuro rounded-pill text-[11px] font-serif border border-shiraki-dark transition-colors"
                >
                  去感應 ➔
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- VIEW 3: 🍵「共好」(Exchange & Share View) -->
      <section v-else-if="activeTab === 'exchange'" class="flex-1 p-4 space-y-4">
        <!-- Balance Header -->
        <div class="flex items-center justify-between pb-1 border-b border-shiraki-dark">
          <div>
            <h2 class="font-serif text-base font-bold text-sumikuro">
              點數與心意換取
            </h2>
            <p class="text-[11px] text-chausu font-serif">
              自處與利他，成就雙向圓滿
            </p>
          </div>
          <div class="text-right">
            <span class="text-[10px] text-chausu font-serif">可用資產</span>
            <div class="font-number font-bold text-lg text-wakatake">
              {{ dashboard.points?.current_balance || 0 }} <span class="text-xs">pt</span>
            </div>
          </div>
        </div>

        <!-- 1. 喜捨・倍增愛心 (Qianshan Foundation) -->
        <div class="space-y-2">
          <div class="flex items-center gap-1 text-xs font-serif font-bold text-nadeshiko">
            <span>❦</span> 【 喜捨・倍增愛心 】
          </div>

          <div class="bg-gradient-to-br from-[#FFF9F8] to-[#FAF1ED] p-4 rounded-2xl border-2 border-nadeshiko/30 shadow-zen space-y-3">
            <div>
              <div class="text-xs font-serif font-bold text-sumikuro">
                南投縣私立前山社會福利慈善事業基金會
              </div>
              <p class="text-xs text-sumikuro/80 font-serif leading-relaxed mt-1">
                同仁出 <span class="font-bold text-nadeshiko">100 pt</span> 點數，竹山秀傳配對加碼代捐
                <span class="font-bold text-wakatake">NT$ 200 元</span>。贈與南投在地偏鄉長者與弱勢關懷。
              </p>
            </div>

            <div class="p-2.5 bg-white/70 rounded-xl border border-nadeshiko/20 flex items-center justify-between text-xs font-serif">
              <span class="text-chausu">捐贈門檻：以 100 pt 為單位</span>
              <span class="text-nadeshiko font-bold">加贈『善行木刻印章』感謝狀</span>
            </div>

            <button
              @click="handleCharityClick"
              :disabled="isDonating || (dashboard.points?.current_balance || 0) < 100"
              class="w-full py-2.5 bg-nadeshiko hover:bg-nadeshiko-dark disabled:opacity-50 text-white font-serif text-xs rounded-pill shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <span>呈獻 100 點愛心 (加贈『善行木刻印章』)</span>
            </button>
          </div>
        </div>

        <!-- 2. 犒賞・日嚐好物 (Canteen & Life Rewards) -->
        <div class="space-y-2 pt-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-serif font-bold text-sumikuro flex items-center gap-1">
              <span>🎁</span> 【 犒賞・日嚐好物 】 (10 點 = 10 元)
            </span>
            <button @click="openMyCoupons" class="text-[11px] text-wakatake font-serif hover:underline">
              已兌換票券 ({{ myCoupons.length }})
            </button>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="item in catalogItems"
              :key="item.id"
              class="bg-white p-3 rounded-2xl border border-shiraki-dark shadow-zen flex flex-col justify-between"
            >
              <div>
                <div class="w-full h-20 bg-shiraki-light rounded-xl flex items-center justify-center text-3xl mb-2 relative">
                  <span>{{ item.icon || '🎁' }}</span>
                  <span
                    v-if="typeof item.stock === 'number'"
                    class="absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-white/90 text-chausu border border-shiraki-dark font-mono"
                  >
                    餘 {{ item.stock }}
                  </span>
                </div>
                <h4 class="font-serif font-bold text-xs text-sumikuro line-clamp-1">
                  {{ item.name }}
                </h4>
                <p class="text-[10px] text-chausu font-serif line-clamp-2 mt-0.5 leading-tight">
                  {{ item.description }}
                </p>
              </div>

              <div class="mt-3 pt-2 border-t border-shiraki-dark/60 flex items-center justify-between">
                <span class="font-mono font-bold text-xs text-wakatake">
                  {{ item.points }} pt
                </span>
                <button
                  @click="handleRedeemCoupon(item)"
                  :disabled="isRedeeming || (dashboard.points?.current_balance || 0) < item.points || (typeof item.stock === 'number' && item.stock <= 0)"
                  class="px-3 py-1 bg-wakatake hover:bg-wakatake-dark disabled:opacity-40 text-white rounded-pill text-[11px] font-serif transition-colors"
                >
                  {{ typeof item.stock === 'number' && item.stock <= 0 ? '已兌畢' : '換取憑證' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- BOTTOM LINE LIFF NAVIGATION TABS -->
      <nav class="fixed bottom-0 z-40 w-full max-w-md bg-white/95 backdrop-blur-md border-t border-shiraki-dark flex items-center justify-around py-2 shadow-lg">
        <button
          @click="activeTab = 'garden'"
          class="flex flex-col items-center gap-0.5 py-1 px-4 transition-colors"
          :class="activeTab === 'garden' ? 'text-wakatake font-bold' : 'text-chausu hover:text-sumikuro'"
        >
          <span class="text-lg">🌿</span>
          <span class="text-[11px] font-serif">庭園</span>
        </button>

        <button
          @click="activeTab = 'habits'"
          class="flex flex-col items-center gap-0.5 py-1 px-4 transition-colors"
          :class="activeTab === 'habits' ? 'text-wakatake font-bold' : 'text-chausu hover:text-sumikuro'"
        >
          <span class="text-lg">📋</span>
          <span class="text-[11px] font-serif">修養</span>
        </button>

        <button
          @click="activeTab = 'exchange'"
          class="flex flex-col items-center gap-0.5 py-1 px-4 transition-colors"
          :class="activeTab === 'exchange' ? 'text-wakatake font-bold' : 'text-chausu hover:text-sumikuro'"
        >
          <span class="text-lg">🍵</span>
          <span class="text-[11px] font-serif">共好</span>
        </button>
      </nav>

      <!-- MODALS & DRAWERS -->
      <!-- 1. Charity Certificate Modal (和紙感謝狀函) -->
      <CharityModal
        :is-open="isCharityModalOpen"
        :donor-name="dashboard.employee_info?.name"
        :employee-no="dashboard.employee_info?.employee_no"
        :dept-name="dashboard.employee_info?.dept_name"
        :donated-points="lastDonationResult.donated_points || 100"
        :matching-fund="lastDonationResult.hospital_matching_fund || 200"
        :tx-id="lastDonationResult.transaction_id || 'TX-20261030-9981'"
        @close="isCharityModalOpen = false"
      />

      <!-- 2. Voucher QR Code Modal -->
      <VoucherModal
        :is-open="isVoucherModalOpen"
        :voucher="selectedVoucher"
        @close="isVoucherModalOpen = false"
        @verified="handleVoucherVerified"
      />

      <!-- 3. Hospital Edge Hardware Simulator Drawer -->
      <EdgeSimulatorModal
        :is-open="isEdgeSimulatorOpen"
        :current-employee="dashboard.employee_info"
        :active-gym-session="activeGymSession"
        @close="isEdgeSimulatorOpen = false"
        @hardware-triggered="handleHardwareTriggered"
      />

      <!-- 4. Admin & Ledger Audit Modal -->
      <AdminLedgerModal
        :is-open="isAdminModalOpen"
        @close="isAdminModalOpen = false"
        @reset-data="refreshAll"
      />

      <!-- 5. Simulated LINE Notification Drawer -->
      <NotificationDrawer
        :is-open="isNotificationOpen"
        :notifications="notifications"
        @close="isNotificationOpen = false"
      />

      <!-- 6. My Coupons Drawer / List Modal -->
      <transition name="fade">
        <div
          v-if="isMyCouponsModalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sumikuro/50 backdrop-blur-sm"
          @click.self="isMyCouponsModalOpen = false"
        >
          <div class="relative w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-shiraki-dark max-h-[80vh] flex flex-col text-sumikuro">
            <div class="flex items-center justify-between pb-3 border-b border-shiraki-dark">
              <h3 class="font-serif font-bold text-sm">我的福利與禮遇券</h3>
              <button @click="isMyCouponsModalOpen = false" class="text-chausu hover:text-sumikuro">✕</button>
            </div>
            <div class="flex-1 overflow-y-auto py-3 space-y-2">
              <div v-if="myCoupons.length === 0" class="text-center py-8 text-xs text-chausu font-serif">
                尚未換取任何福利券
              </div>
              <div
                v-for="c in myCoupons"
                :key="c.id"
                @click="openSpecificCoupon(c)"
                class="p-3 rounded-xl border border-shiraki-dark hover:border-wakatake cursor-pointer transition-all flex items-center justify-between bg-shiraki-light/50"
              >
                <div>
                  <div class="font-serif font-bold text-xs">{{ c.item_name }}</div>
                  <div class="text-[10px] text-chausu font-mono mt-0.5">{{ c.qr_voucher_code }}</div>
                </div>
                <div class="flex items-center gap-2">
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-serif"
                    :class="c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'"
                  >
                    {{ c.status === 'ACTIVE' ? '可使用' : '已核銷' }}
                  </span>
                  <span class="text-xs text-chausu">➔</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import LoginView from './components/LoginView.vue';
import AdminDashboard from './components/AdminDashboard.vue';
import ZenGardenTree from './components/ZenGardenTree.vue';
import CharityModal from './components/CharityModal.vue';
import VoucherModal from './components/VoucherModal.vue';
import EdgeSimulatorModal from './components/EdgeSimulatorModal.vue';
import AdminLedgerModal from './components/AdminLedgerModal.vue';
import NotificationDrawer from './components/NotificationDrawer.vue';
import { apiFetch, getAuthToken, clearAuthToken, setUnauthorizedHandler } from './utils/api.js';

// Authentication state
const isAuthenticated = ref(false);
const currentUser = ref(null);
const appMode = ref('liff'); // 'liff' | 'admin'

// Navigation tab state: 'garden' | 'habits' | 'exchange'
const activeTab = ref('garden');

// Data states
const dashboard = ref({
  employee_info: { name: '陳小嵐', employee_no: 'E2108', dept_name: '急診護理部', card_uid: 'CARD-CSH-8821' },
  points: { current_balance: 120, cash_equivalent: 120 },
  tree: { current_level: 2, level_name: '茁壯若竹', current_exp: 120, next_level_exp: 150, pending_dew: 2 },
  charity_eligible: true
});

const todayTasks = ref([]);
const activeGymSession = ref(null);
const catalogItems = ref([]);
const myCoupons = ref([]);
const notifications = ref([]);

// Modals
const isCharityModalOpen = ref(false);
const isVoucherModalOpen = ref(false);
const selectedVoucher = ref(null);
const isEdgeSimulatorOpen = ref(false);
const isAdminModalOpen = ref(false);
const isNotificationOpen = ref(false);
const isMyCouponsModalOpen = ref(false);

const isDonating = ref(false);
const isRedeeming = ref(false);
const lastDonationResult = ref({});

const treeLevelInfo = computed(() => {
  return {
    level: dashboard.value.tree?.current_level || 2,
    levelName: dashboard.value.tree?.level_name || '茁壯若竹',
    currentExp: dashboard.value.tree?.current_exp || 120,
    nextLevelExp: dashboard.value.tree?.next_level_exp || 150,
    isMaxLevel: dashboard.value.tree?.is_max_level || false
  };
});

const isAdmin = computed(() => {
  const role = currentUser.value?.role || dashboard.value.employee_info?.role;
  return role === 'ADMIN';
});

const unreadNotificationsCount = computed(() => {
  return notifications.value.filter(n => !n.is_read).length;
});

onMounted(async () => {
  setUnauthorizedHandler(() => {
    isAuthenticated.value = false;
    appMode.value = 'liff';
  });

  const existingToken = getAuthToken();
  if (existingToken) {
    try {
      const res = await apiFetch('/api/v1/auth/me');
      const result = await res.json();
      if (res.ok && result.code === 200) {
        currentUser.value = result.data;
        isAuthenticated.value = true;
        appMode.value = result.data?.role === 'ADMIN' ? 'admin' : 'liff';
        await refreshAll();
        return;
      }
    } catch (err) {
      console.error('Session verification failed:', err);
    }
    clearAuthToken();
  }
  isAuthenticated.value = false;
});

async function handleLoginSuccess(user) {
  currentUser.value = user || null;
  isAuthenticated.value = true;
  activeTab.value = 'garden';
  appMode.value = user?.role === 'ADMIN' ? 'admin' : 'liff';
  await refreshAll();
}

function handleLogout() {
  clearAuthToken();
  currentUser.value = null;
  isAuthenticated.value = false;
  appMode.value = 'liff';
  isEdgeSimulatorOpen.value = false;
  isAdminModalOpen.value = false;
  isNotificationOpen.value = false;
  isMyCouponsModalOpen.value = false;
  isCharityModalOpen.value = false;
  isVoucherModalOpen.value = false;
}

async function refreshAll() {
  await Promise.all([
    fetchDashboard(),
    fetchTasks(),
    fetchCatalog(),
    fetchMyCoupons(),
    fetchNotifications()
  ]);
}

async function fetchDashboard() {
  try {
    const res = await apiFetch('/api/v1/tree/dashboard');
    const result = await res.json();
    if (result.code === 200) {
      dashboard.value = result.data;
    }
  } catch (err) {
    console.error('Error fetching dashboard:', err);
  }
}

async function fetchTasks() {
  try {
    const res = await apiFetch('/api/v1/tasks/today');
    const result = await res.json();
    if (result.code === 200) {
      todayTasks.value = result.data.tasks || [];
      activeGymSession.value = result.data.active_gym_session;
    }
  } catch (err) {
    console.error('Error fetching tasks:', err);
  }
}

async function fetchCatalog() {
  try {
    const res = await apiFetch('/api/v1/redemption/catalog');
    const result = await res.json();
    if (result.code === 200) {
      catalogItems.value = result.data || [];
    }
  } catch (err) {
    console.error('Error fetching catalog:', err);
  }
}

async function fetchMyCoupons() {
  try {
    const res = await apiFetch('/api/v1/redemption/my-coupons');
    const result = await res.json();
    if (result.code === 200) {
      myCoupons.value = result.data || [];
    }
  } catch (err) {
    console.error('Error fetching coupons:', err);
  }
}

async function fetchNotifications() {
  try {
    const res = await apiFetch('/api/v1/integrations/notifications');
    const result = await res.json();
    if (result.code === 200) {
      notifications.value = result.data || [];
    }
  } catch (err) {
    console.error('Error fetching notifications:', err);
  }
}

// Watering action
async function handleWater({ onSuccess, onError }) {
  try {
    const res = await apiFetch('/api/v1/tree/water', {
      method: 'POST',
      body: JSON.stringify({ water_amount: 1 })
    });
    const result = await res.json();
    if (result.code === 200) {
      if (onSuccess) onSuccess(result.data);
      await fetchDashboard();
      await fetchNotifications();
    } else {
      alert(result.message);
      if (onError) onError();
    }
  } catch (err) {
    alert('澆灌失敗: ' + err.message);
    if (onError) onError();
  }
}

// Charity donation (前山基金會專案 100 pt -> NT$ 200)
async function handleCharityClick() {
  if (dashboard.value.points.current_balance < 100) {
    alert('點數未達 100 點門檻，請先透過蔬食或運動積累點數！');
    return;
  }

  isDonating.value = true;
  try {
    const res = await apiFetch('/api/v1/redemption/charity-donate', {
      method: 'POST',
      body: JSON.stringify({
        project_code: 'QIAN_SHAN_2026',
        points_to_donate: 100
      })
    });
    const result = await res.json();
    if (result.code === 200) {
      lastDonationResult.value = result.data;
      isCharityModalOpen.value = true;
      await refreshAll();
    } else {
      alert(result.message);
    }
  } catch (err) {
    alert('捐贈失敗: ' + err.message);
  } finally {
    isDonating.value = false;
  }
}

// Redeem coupon
async function handleRedeemCoupon(item) {
  if (dashboard.value.points.current_balance < item.points) {
    alert(`點數不足！需要 ${item.points} pt，目前僅有 ${dashboard.value.points.current_balance} pt`);
    return;
  }

  isRedeeming.value = true;
  try {
    const res = await apiFetch('/api/v1/redemption/coupon', {
      method: 'POST',
      body: JSON.stringify({ item_id: item.id })
    });
    const result = await res.json();
    if (result.code === 200) {
      selectedVoucher.value = result.data.voucher;
      isVoucherModalOpen.value = true;
      await refreshAll();
    } else {
      alert(result.message);
    }
  } catch (err) {
    alert('兌換失敗: ' + err.message);
  } finally {
    isRedeeming.value = false;
  }
}

function openMyCoupons() {
  isMyCouponsModalOpen.value = true;
}

function openSpecificCoupon(c) {
  selectedVoucher.value = c;
  isMyCouponsModalOpen.value = false;
  isVoucherModalOpen.value = true;
}

function handleVoucherVerified(updatedVoucher) {
  selectedVoucher.value = updatedVoucher;
  refreshAll();
}

function handleHardwareTriggered(result) {
  refreshAll();
}

function formatHabitBadge(task, index) {
  const numerals = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  const prefix = numerals[index] || `${index + 1}`;
  return `${prefix}・${task.category || '修養'}`;
}

async function completeCustomTask(task) {
  try {
    const res = await apiFetch(`/api/v1/tasks/${task.id}/complete`, {
      method: 'POST',
      body: JSON.stringify({})
    });
    const result = await res.json();
    if (result.code === 200) {
      await refreshAll();
    } else {
      alert(result.message || '打卡失敗');
    }
  } catch (err) {
    alert('打卡失敗: ' + err.message);
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

