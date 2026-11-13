<template>
  <div class="min-h-screen washi-pattern text-sumikuro antialiased">
    <!-- Top Admin Header -->
    <header class="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-shiraki-dark shadow-sm">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-wakatake text-white flex items-center justify-center text-lg shadow-sm">
            🏛️
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="font-serif font-bold text-base sm:text-lg text-sumikuro tracking-wide">
                竹山秀傳健康銀行・管理平台
              </h1>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-wakatake-50 text-wakatake border border-wakatake-200 font-serif">
                職安衛 / 人資後台
              </span>
            </div>
            <p class="text-[11px] text-chausu font-serif">
              操作人員：{{ currentUser?.name || '系統管理員' }} ({{ currentUser?.employee_no || 'ADMIN' }}・{{ currentUser?.role === 'ADMIN' ? 'ADMIN 系統管理員' : (currentUser?.role || 'STAFF') }})
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="$emit('back-to-frontend')"
            class="px-3.5 py-1.5 rounded-pill text-xs font-serif bg-wakatake hover:bg-wakatake-dark text-white transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>🌿</span>
            <span>返回員工前台</span>
          </button>
          <button
            @click="$emit('logout')"
            class="px-3 py-1.5 rounded-pill text-xs font-serif bg-shiraki hover:bg-shiraki-dark text-sumikuro border border-shiraki-dark transition-colors"
          >
            登出
          </button>
        </div>
      </div>

      <!-- Sub Navigation Tabs -->
      <div class="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto border-t border-shiraki-dark/50 bg-shiraki-light/60">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="switchTab(tab.id)"
          class="px-4 py-2.5 text-xs font-serif font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5"
          :class="
            activeTab === tab.id
              ? 'border-wakatake text-wakatake font-bold bg-white/70'
              : 'border-transparent text-chausu hover:text-sumikuro'
          "
        >
          <span>{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
        </button>
      </div>
    </header>

    <!-- Main Workspace -->
    <main class="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <!-- Toast Message -->
      <transition name="fade">
        <div
          v-if="toastMessage"
          class="p-3 rounded-xl bg-wakatake text-white text-xs font-serif shadow-md flex items-center justify-between"
        >
          <span>✓ {{ toastMessage }}</span>
          <button @click="toastMessage = ''" class="text-white/80 hover:text-white">✕</button>
        </div>
      </transition>

      <!-- ==================== TAB 1: 營運總覽 ==================== -->
      <section v-if="activeTab === 'overview'" class="space-y-6">
        <!-- KPI Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white p-4 rounded-2xl border border-shiraki-dark shadow-zen">
            <div class="text-xs text-chausu font-serif">註冊 / 啟用會員</div>
            <div class="mt-2 flex items-baseline gap-1.5">
              <span class="text-3xl font-bold font-number text-wakatake">{{ overview.users?.active || 0 }}</span>
              <span class="text-xs text-chausu font-serif">/ {{ overview.users?.total || 0 }} 人</span>
            </div>
            <div class="text-[11px] text-chausu mt-1">院內員工身分綁定</div>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-shiraki-dark shadow-zen">
            <div class="text-xs text-chausu font-serif">流通健康點數總計</div>
            <div class="mt-2 flex items-baseline gap-1.5">
              <span class="text-3xl font-bold font-number text-kohaku-dark">{{ overview.points?.total_circulation || 0 }}</span>
              <span class="text-xs text-chausu font-serif">pt</span>
            </div>
            <div class="text-[11px] text-chausu mt-1">等值 NT$ {{ overview.points?.total_circulation || 0 }}</div>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-shiraki-dark shadow-zen">
            <div class="text-xs text-chausu font-serif">日嚐好物上架數</div>
            <div class="mt-2 flex items-baseline gap-1.5">
              <span class="text-3xl font-bold font-number text-sumikuro">{{ overview.catalog?.active || 0 }}</span>
              <span class="text-xs text-chausu font-serif">/ {{ overview.catalog?.total || 0 }} 項</span>
            </div>
            <div class="text-[11px] text-chausu mt-1">
              福利券已核銷 {{ overview.vouchers?.used || 0 }} 張・待用 {{ overview.vouchers?.active || 0 }} 張
            </div>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-nadeshiko/30 shadow-zen bg-gradient-to-br from-white to-[#FFF9F8]">
            <div class="text-xs text-nadeshiko font-serif font-semibold">前山基金會配對代捐</div>
            <div class="mt-2 flex items-baseline gap-1.5">
              <span class="text-3xl font-bold font-number text-nadeshiko">NT$ {{ overview.charity?.total_matching_ntd || 0 }}</span>
            </div>
            <div class="text-[11px] text-chausu mt-1">
              累計愛心 {{ overview.charity?.total_points || 0 }} pt ({{ overview.charity?.count || 0 }} 筆)
            </div>
          </div>
        </div>

        <!-- Quick Shortcuts & Recent Audits -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="bg-white p-5 rounded-2xl border border-shiraki-dark shadow-zen space-y-3">
            <h2 class="font-serif font-bold text-sm text-sumikuro">・快速管理捷徑</h2>
            <div class="space-y-2">
              <button
                @click="switchTab('members'); openCreateUserModal()"
                class="w-full py-2.5 px-4 rounded-xl bg-wakatake-50 hover:bg-wakatake-100 text-wakatake-dark text-xs font-serif font-semibold text-left flex items-center justify-between border border-wakatake-200 transition-colors"
              >
                <span>➕ 新增院內員工會員</span>
                <span>➔</span>
              </button>
              <button
                @click="switchTab('catalog'); openCreateCatalogModal()"
                class="w-full py-2.5 px-4 rounded-xl bg-shiraki hover:bg-shiraki-dark text-sumikuro text-xs font-serif font-semibold text-left flex items-center justify-between border border-shiraki-dark transition-colors"
              >
                <span>🎁 上架新日嚐好物商品</span>
                <span>➔</span>
              </button>
              <button
                @click="switchTab('habitTasks')"
                class="w-full py-2.5 px-4 rounded-xl bg-shiraki-light hover:bg-shiraki text-sumikuro text-xs font-serif font-semibold text-left flex items-center justify-between border border-shiraki-dark transition-colors"
              >
                <span>📋 設定日常修養任務 ({{ overview.habit_tasks?.active || 0 }} / {{ overview.habit_tasks?.total || 0 }})</span>
                <span>➔</span>
              </button>
              <button
                @click="switchTab('redemptions')"
                class="w-full py-2.5 px-4 rounded-xl bg-shiraki-light hover:bg-shiraki text-sumikuro text-xs font-serif font-semibold text-left flex items-center justify-between border border-shiraki-dark transition-colors"
              >
                <span>🎟️ 審核福利券與前山對帳清冊</span>
                <span>➔</span>
              </button>
            </div>
          </div>

          <div class="lg:col-span-2 bg-white p-5 rounded-2xl border border-shiraki-dark shadow-zen space-y-3">
            <div class="flex items-center justify-between">
              <h2 class="font-serif font-bold text-sm text-sumikuro">・近期稽核軌跡 (Audit Log)</h2>
              <button @click="switchTab('audit')" class="text-xs text-wakatake font-serif hover:underline">
                查看全部 ➔
              </button>
            </div>
            <div v-if="!overview.recent_audits || overview.recent_audits.length === 0" class="text-center py-8 text-xs text-chausu font-serif">
              尚無管理員異動紀錄
            </div>
            <div v-else class="divide-y divide-shiraki-dark/60">
              <div
                v-for="log in overview.recent_audits"
                :key="log.id"
                class="py-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-shiraki text-sumikuro mr-1.5">
                    {{ log.action }}
                  </span>
                  <span class="font-serif text-sumikuro">{{ log.reason }}</span>
                  <span class="text-[10px] text-chausu ml-1.5">by {{ log.actor }}</span>
                </div>
                <span class="text-[10px] font-mono text-chausu whitespace-nowrap">
                  {{ formatDateTime(log.created_at) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== TAB 2: 會員管理 ==================== -->
      <section v-else-if="activeTab === 'members'" class="space-y-4">
        <div class="bg-white p-4 rounded-2xl border border-shiraki-dark shadow-zen flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-2 flex-1 min-w-[220px] max-w-md">
            <input
              v-model="memberSearch"
              @keyup.enter="loadUsers"
              type="text"
              placeholder="搜尋工號、姓名、部門或識別證卡號..."
              class="flex-1 h-10 px-3.5 rounded-xl bg-washi border border-shiraki-dark text-xs focus:outline-none focus:border-wakatake"
            />
            <button
              @click="loadUsers"
              class="px-4 h-10 rounded-pill bg-shiraki hover:bg-shiraki-dark text-xs font-serif border border-shiraki-dark transition-colors"
            >
              查詢
            </button>
          </div>
          <button
            @click="openCreateUserModal"
            class="px-4 h-10 rounded-pill bg-wakatake hover:bg-wakatake-dark text-white text-xs font-serif shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>新增同仁會員</span>
          </button>
        </div>

        <div class="bg-white rounded-2xl border border-shiraki-dark shadow-zen overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-shiraki text-chausu font-serif text-[11px] border-b border-shiraki-dark">
                <tr>
                  <th class="p-3">工號 / 姓名</th>
                  <th class="p-3">部門 / 角色</th>
                  <th class="p-3">RFID 卡號 / LINE</th>
                  <th class="p-3">健康樹狀態</th>
                  <th class="p-3">點數餘額</th>
                  <th class="p-3">帳號狀態</th>
                  <th class="p-3 text-right">管理操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-shiraki-dark/60">
                <tr v-for="u in users" :key="u.id" class="hover:bg-shiraki-light/50">
                  <td class="p-3">
                    <div class="font-mono font-bold text-wakatake">{{ u.employee_no }}</div>
                    <div class="font-serif font-bold text-sumikuro mt-0.5">{{ u.name }}</div>
                  </td>
                  <td class="p-3">
                    <div class="text-sumikuro font-serif">{{ u.dept_code }}</div>
                    <span
                      class="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-mono border"
                      :class="
                        u.role === 'ADMIN'
                          ? 'bg-kohaku/15 text-kohaku-dark border-kohaku/30'
                          : 'bg-shiraki-light text-chausu border-shiraki-dark'
                      "
                    >
                      {{ u.role === 'ADMIN' ? 'ADMIN (系統管理員)' : 'STAFF (醫護同仁)' }}
                    </span>
                  </td>
                  <td class="p-3 font-mono text-[11px] text-chausu">
                    <div>卡號：{{ u.card_uid || '未綁定' }}</div>
                    <div class="truncate max-w-[140px]">LINE：{{ u.line_user_id || '未綁定' }}</div>
                  </td>
                  <td class="p-3 font-serif">
                    <div class="font-semibold text-wakatake-dark">
                      Lv.{{ u.tree?.level }} {{ u.tree?.level_name }}
                    </div>
                    <div class="text-[10px] text-chausu">
                      {{ u.tree?.total_exp || 0 }} EXP・{{ u.tree?.pending_dew || 0 }} 露水
                    </div>
                  </td>
                  <td class="p-3 font-mono font-bold text-sm text-sumikuro">
                    {{ u.current_balance }} <span class="text-[10px] font-normal text-chausu">pt</span>
                  </td>
                  <td class="p-3">
                    <button
                      @click="toggleUserActive(u)"
                      class="px-2.5 py-0.5 rounded-full text-[10px] font-serif border transition-colors"
                      :class="
                        u.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      "
                    >
                      {{ u.is_active ? '● 啟用中' : '○ 已停用' }}
                    </button>
                  </td>
                  <td class="p-3 text-right space-x-1 whitespace-nowrap">
                    <button
                      @click="openEditUserModal(u)"
                      class="px-2.5 py-1 rounded-pill bg-shiraki hover:bg-shiraki-dark text-sumikuro text-[11px] font-serif border border-shiraki-dark"
                    >
                      編輯
                    </button>
                    <button
                      @click="openAdjustPointsModal(u)"
                      class="px-2.5 py-1 rounded-pill bg-amber-50 hover:bg-amber-100 text-kohaku-dark text-[11px] font-serif border border-amber-200"
                    >
                      調點
                    </button>
                    <button
                      @click="openAdjustTreeModal(u)"
                      class="px-2.5 py-1 rounded-pill bg-wakatake-50 hover:bg-wakatake-100 text-wakatake-dark text-[11px] font-serif border border-wakatake-200"
                    >
                      調樹
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ==================== TAB 3: 日嚐好物管理 ==================== -->
      <section v-else-if="activeTab === 'catalog'" class="space-y-4">
        <div class="bg-white p-4 rounded-2xl border border-shiraki-dark shadow-zen flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 class="font-serif font-bold text-sm text-sumikuro">・日嚐好物與生活禮遇目錄管理</h2>
            <p class="text-[11px] text-chausu font-serif mt-0.5">
              上架狀態與庫存變動將即時同步至員工前台「🍵 共好」兌換專區
            </p>
          </div>
          <button
            @click="openCreateCatalogModal"
            class="px-4 h-10 rounded-pill bg-wakatake hover:bg-wakatake-dark text-white text-xs font-serif shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>新增日嚐好物</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="item in catalogItems"
            :key="item.id"
            class="bg-white p-4 rounded-2xl border shadow-zen flex flex-col justify-between transition-all"
            :class="item.is_active !== false ? 'border-shiraki-dark' : 'border-gray-200 opacity-70 bg-gray-50'"
          >
            <div>
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-xl bg-shiraki-light border border-shiraki-dark flex items-center justify-center text-2xl">
                    {{ item.icon || '🎁' }}
                  </div>
                  <div>
                    <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-shiraki text-chausu">
                      {{ categoryLabel(item.category) }}
                    </span>
                    <h3 class="font-serif font-bold text-sm text-sumikuro mt-1">{{ item.name }}</h3>
                  </div>
                </div>
                <button
                  @click="toggleCatalogActive(item)"
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-serif border whitespace-nowrap"
                  :class="
                    item.is_active !== false
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-gray-200 text-gray-600 border-gray-300'
                  "
                >
                  {{ item.is_active !== false ? '上架中' : '已下架' }}
                </button>
              </div>

              <p class="text-xs text-chausu font-serif mt-3 leading-relaxed">
                {{ item.description || '無描述說明' }}
              </p>

              <div class="grid grid-cols-3 gap-2 mt-3 p-2.5 rounded-xl bg-shiraki-light border border-shiraki-dark/70 text-center">
                <div>
                  <div class="text-[10px] text-chausu font-serif">兌換點數</div>
                  <div class="font-mono font-bold text-xs text-wakatake mt-0.5">{{ item.points }} pt</div>
                </div>
                <div>
                  <div class="text-[10px] text-chausu font-serif">剩餘庫存</div>
                  <div class="font-mono font-bold text-xs text-sumikuro mt-0.5">{{ item.stock ?? '∞' }}</div>
                </div>
                <div>
                  <div class="text-[10px] text-chausu font-serif">已兌換</div>
                  <div class="font-mono font-bold text-xs text-kohaku-dark mt-0.5">{{ item.redeemed_count || 0 }} 次</div>
                </div>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-shiraki-dark/60 flex items-center justify-end gap-2">
              <button
                @click="openEditCatalogModal(item)"
                class="px-3 py-1 rounded-pill bg-shiraki hover:bg-shiraki-dark text-sumikuro text-xs font-serif border border-shiraki-dark"
              >
                編輯
              </button>
              <button
                @click="deleteCatalogItem(item)"
                class="px-3 py-1 rounded-pill bg-red-50 hover:bg-red-100 text-nadeshiko text-xs font-serif border border-red-200"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== TAB 3.5: 運動項目維護 ==================== -->
      <section v-else-if="activeTab === 'sports'" class="space-y-4">
        <div class="bg-white p-4 rounded-2xl border border-shiraki-dark shadow-zen flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 class="font-serif font-bold text-sm text-sumikuro">・體能教室運動項目與達標獎勵維護</h2>
            <p class="text-[11px] text-chausu font-serif mt-0.5">
              啟用中之運動項目將同步顯示於體能教室門禁模擬器，並依設定分鐘數與獎勵點數核算入帳
            </p>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <input
              v-model.trim="sportSearch"
              @keyup.enter="loadSports"
              type="text"
              placeholder="搜尋運動名稱或場域..."
              class="h-10 px-3.5 rounded-xl bg-washi border border-shiraki-dark text-xs w-48 focus:outline-none focus:border-wakatake"
            />
            <button
              @click="loadSports"
              class="px-3.5 h-10 rounded-xl bg-shiraki hover:bg-shiraki-dark text-xs font-serif border border-shiraki-dark transition-colors"
            >
              查詢
            </button>
            <button
              @click="openCreateSportModal"
              class="px-4 h-10 rounded-pill bg-wakatake hover:bg-wakatake-dark text-white text-xs font-serif shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span>➕</span>
              <span>新增運動項目</span>
            </button>
          </div>
        </div>

        <div v-if="sportItems.length === 0" class="bg-white p-8 rounded-2xl border border-shiraki-dark text-center text-xs text-chausu font-serif">
          目前尚無符合條件的運動項目
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="sport in sportItems"
            :key="sport.id"
            class="bg-white p-4 rounded-2xl border shadow-zen flex flex-col justify-between transition-all"
            :class="sport.is_active !== false ? 'border-shiraki-dark' : 'border-gray-200 opacity-70 bg-gray-50'"
          >
            <div>
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-2xl">
                    {{ sport.icon || '🏃' }}
                  </div>
                  <div>
                    <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-shiraki text-chausu">
                      {{ sportCategoryLabel(sport.category) }}
                    </span>
                    <span
                      class="ml-1 text-[10px] font-serif px-1.5 py-0.5 rounded border"
                      :class="
                        sport.usage_mode === 'SINGLE'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      "
                    >
                      {{ sport.usage_mode === 'SINGLE' ? '👤 限單人使用' : '👥 可同時多人' }}
                    </span>
                    <h3 class="font-serif font-bold text-sm text-sumikuro mt-1">{{ sport.name }}</h3>
                    <div class="text-[11px] text-chausu font-serif mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>📍 {{ sport.location || '體能教室' }}</span>
                      <span v-if="sport.active_users_count > 0" class="text-blue-700 font-semibold">
                        ● 使用中 ({{ sport.active_users_count }} 人)
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  @click="toggleSportActive(sport)"
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-serif border whitespace-nowrap"
                  :class="
                    sport.is_active !== false
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-gray-200 text-gray-600 border-gray-300'
                  "
                >
                  {{ sport.is_active !== false ? '啟用中' : '已停用' }}
                </button>
              </div>

              <p class="text-xs text-chausu font-serif mt-3 leading-relaxed">
                {{ sport.description || '無項目說明' }}
              </p>

              <!-- Dedicated QR Code Bar -->
              <div class="mt-3 px-2.5 py-2 rounded-xl bg-washi border border-dashed border-shiraki-dark flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <div class="text-[10px] text-chausu font-serif">專屬門禁 QR Code</div>
                  <div class="font-mono text-[11px] font-bold text-sumikuro truncate">{{ sport.qr_code }}</div>
                </div>
                <button
                  @click="openSportQrModal(sport)"
                  class="px-2.5 py-1 rounded-pill bg-white hover:bg-shiraki border border-shiraki-dark text-[11px] font-serif text-wakatake whitespace-nowrap shadow-xs"
                >
                  📱 查看 QR Code
                </button>
              </div>

              <div class="grid grid-cols-4 gap-1.5 mt-3 p-2.5 rounded-xl bg-shiraki-light border border-shiraki-dark/70 text-center">
                <div>
                  <div class="text-[10px] text-chausu font-serif">達標時長</div>
                  <div class="font-mono font-bold text-xs text-blue-700 mt-0.5">{{ sport.min_duration_mins }} 分</div>
                </div>
                <div>
                  <div class="text-[10px] text-chausu font-serif">獎勵點數</div>
                  <div class="font-mono font-bold text-xs text-wakatake mt-0.5">+{{ sport.reward_points }} pt</div>
                </div>
                <div>
                  <div class="text-[10px] text-chausu font-serif">獎勵露水</div>
                  <div class="font-mono font-bold text-xs text-kohaku-dark mt-0.5">+{{ sport.reward_dew }} 滴</div>
                </div>
                <div>
                  <div class="text-[10px] text-chausu font-serif">當日上限</div>
                  <div class="font-mono font-bold text-xs text-sumikuro mt-0.5">
                    {{ (sport.daily_limit ?? 1) === 0 ? '不限次' : `${sport.daily_limit ?? 1} 次` }}
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-shiraki-dark/60 flex items-center justify-end gap-2">
              <button
                @click="openEditSportModal(sport)"
                class="px-3 py-1 rounded-pill bg-shiraki hover:bg-shiraki-dark text-sumikuro text-xs font-serif border border-shiraki-dark"
              >
                編輯
              </button>
              <button
                @click="deleteSportItem(sport)"
                class="px-3 py-1 rounded-pill bg-red-50 hover:bg-red-100 text-nadeshiko text-xs font-serif border border-red-200"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== TAB 3.8: 日常修養任務設定 ==================== -->
      <section v-else-if="activeTab === 'habitTasks'" class="space-y-4">
        <div class="bg-white p-4 rounded-2xl border border-shiraki-dark shadow-zen flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="font-serif font-bold text-sm text-sumikuro">・食・動の習慣 — 日常修養任務設定</h2>
            <p class="text-[11px] text-chausu font-serif">
              管理員工前台「修養」分頁呈現的每日任務、分類標籤、獎勵點數/露水與連動來源（{{ habitTasks.filter(t => t.is_active !== false).length }} 項啟用中）
            </p>
          </div>
          <button
            @click="openCreateHabitTaskModal"
            class="px-4 py-2 rounded-pill bg-wakatake hover:bg-wakatake-dark text-white text-xs font-serif font-medium shadow-sm transition-colors"
          >
            ＋ 新增修養任務
          </button>
        </div>

        <div v-if="habitTasks.length === 0" class="bg-white p-10 rounded-2xl border border-shiraki-dark text-center text-xs text-chausu font-serif">
          目前尚無任何日常修養任務，請點擊右上角「＋ 新增修養任務」建立。
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="(task, index) in habitTasks"
            :key="task.id"
            class="bg-white p-4 rounded-2xl border shadow-zen flex flex-col justify-between transition-all"
            :class="task.is_active !== false ? 'border-shiraki-dark' : 'border-gray-200 opacity-70 bg-gray-50'"
          >
            <div>
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-11 h-11 rounded-xl bg-shiraki-light border border-shiraki-dark flex items-center justify-center text-2xl">
                    {{ task.icon || '🌿' }}
                  </div>
                  <div>
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-shiraki text-chausu border border-shiraki-dark">
                        #{{ task.sort_order ?? index + 1 }}
                      </span>
                      <span class="text-xs font-serif font-bold px-2 py-0.5 rounded bg-shiraki text-wakatake-dark border border-shiraki-dark">
                        {{ formatChineseTaskBadge(task, index) }}
                      </span>
                      <span
                        class="text-[10px] font-serif px-1.5 py-0.5 rounded border"
                        :class="
                          task.habit_key === 'CUSTOM'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        "
                      >
                        {{ habitKeyLabel(task.habit_key) }}
                      </span>
                    </div>
                    <h3 class="font-serif font-bold text-sm text-sumikuro mt-1">{{ task.title }}</h3>
                  </div>
                </div>
                <button
                  @click="toggleHabitTaskActive(task)"
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-serif border whitespace-nowrap"
                  :class="
                    task.is_active !== false
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-gray-200 text-gray-600 border-gray-300'
                  "
                >
                  {{ task.is_active !== false ? '啟用中' : '已停用' }}
                </button>
              </div>

              <p class="text-xs text-chausu font-serif mt-3 leading-relaxed">
                {{ task.description || '無任務說明' }}
              </p>

              <div class="grid grid-cols-3 gap-2 mt-3 p-2.5 rounded-xl bg-shiraki-light border border-shiraki-dark/70 text-center">
                <div>
                  <div class="text-[10px] text-chausu font-serif">獎勵點數</div>
                  <div class="font-mono font-bold text-xs text-wakatake mt-0.5">+{{ task.points_reward ?? 0 }} pt</div>
                </div>
                <div>
                  <div class="text-[10px] text-chausu font-serif">獎勵露水</div>
                  <div class="font-mono font-bold text-xs text-emerald-700 mt-0.5">+{{ task.dew_reward ?? 0 }} 滴</div>
                </div>
                <div>
                  <div class="text-[10px] text-chausu font-serif">資料來源</div>
                  <div class="font-serif font-semibold text-[11px] text-sumikuro mt-0.5 truncate">{{ task.source_type || '自主打卡回報' }}</div>
                </div>
              </div>

              <div class="mt-2.5 flex items-center justify-between text-[11px] text-chausu font-serif">
                <span>已達成顯示：<strong class="text-wakatake">{{ task.completed_status_text || '今日已達成' }}</strong></span>
                <span>未完成顯示：{{ task.pending_status_text || '尚未完成' }}</span>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-shiraki-dark/60">
              <button
                @click="openEditHabitTaskModal(task)"
                class="px-3 py-1 rounded-pill bg-shiraki hover:bg-shiraki-dark text-sumikuro text-xs font-serif border border-shiraki-dark"
              >
                編輯設定
              </button>
              <button
                @click="deleteHabitTask(task)"
                class="px-3 py-1 rounded-pill bg-red-50 hover:bg-red-100 text-nadeshiko text-xs font-serif border border-red-200"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== TAB 4: 福利券與公益管理 ==================== -->
      <section v-else-if="activeTab === 'redemptions'" class="space-y-6">
        <!-- Charity Accounting Summary -->
        <div class="bg-white p-5 rounded-2xl border border-shiraki-dark shadow-zen space-y-4">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 class="font-serif font-bold text-sm text-nadeshiko">
                ❦ 前山基金會公益代捐對帳清冊
              </h2>
              <p class="text-[11px] text-chausu font-serif">
                受贈對象：{{ charityReport.summary?.foundation_name || '財團法人南投縣私立前山社會福利慈善事業基金會' }}
              </p>
            </div>
            <button
              @click="downloadCharityCsv"
              class="px-3.5 py-1.5 rounded-pill bg-shiraki hover:bg-shiraki-dark text-sumikuro text-xs font-serif border border-shiraki-dark flex items-center gap-1"
            >
              <span>📥</span> 導出會計 CSV
            </button>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div class="p-3 rounded-xl bg-shiraki-light border border-shiraki-dark">
              <div class="text-[11px] text-chausu font-serif">愛心轉化總點數</div>
              <div class="text-xl font-bold font-number text-nadeshiko mt-0.5">
                {{ charityReport.summary?.total_donated_points || 0 }} pt
              </div>
            </div>
            <div class="p-3 rounded-xl bg-shiraki-light border border-shiraki-dark">
              <div class="text-[11px] text-chausu font-serif">醫院配對代捐金額</div>
              <div class="text-xl font-bold font-number text-wakatake mt-0.5">
                NT$ {{ charityReport.summary?.total_matching_funds_ntd || 0 }}
              </div>
            </div>
            <div class="p-3 rounded-xl bg-shiraki-light border border-shiraki-dark">
              <div class="text-[11px] text-chausu font-serif">捐贈筆數</div>
              <div class="text-xl font-bold font-number text-sumikuro mt-0.5">
                {{ charityReport.summary?.total_records || 0 }} 筆
              </div>
            </div>
          </div>
        </div>

        <!-- All Redemptions & Voucher Verification Table -->
        <div class="bg-white rounded-2xl border border-shiraki-dark shadow-zen overflow-hidden">
          <div class="p-4 border-b border-shiraki-dark flex items-center justify-between flex-wrap gap-2">
            <h3 class="font-serif font-bold text-sm text-sumikuro">・全院兌換與福利券核銷紀錄</h3>
            <div class="flex items-center gap-1.5 text-xs font-serif">
              <button
                v-for="f in ['ALL', 'ACTIVE', 'USED', 'DONATED', 'REVOKED']"
                :key="f"
                @click="redemptionFilter = f"
                class="px-2.5 py-1 rounded-pill border transition-colors"
                :class="
                  redemptionFilter === f
                    ? 'bg-wakatake text-white border-wakatake'
                    : 'bg-shiraki-light text-chausu border-shiraki-dark hover:text-sumikuro'
                "
              >
                {{ redemptionFilterLabel(f) }}
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-shiraki text-chausu font-serif text-[11px] border-b border-shiraki-dark">
                <tr>
                  <th class="p-3">序號 / 憑證代碼</th>
                  <th class="p-3">同仁 / 部門</th>
                  <th class="p-3">項目名稱</th>
                  <th class="p-3">扣除點數 / 價值</th>
                  <th class="p-3">狀態</th>
                  <th class="p-3">建立時間</th>
                  <th class="p-3 text-right">核銷 / 管理</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-shiraki-dark/60">
                <tr v-if="filteredRedemptions.length === 0">
                  <td colspan="7" class="p-6 text-center text-chausu font-serif">尚無符合條件的兌換紀錄</td>
                </tr>
                <tr v-for="r in filteredRedemptions" :key="r.id" class="hover:bg-shiraki-light/40">
                  <td class="p-3 font-mono text-[11px] text-sumikuro">{{ r.qr_voucher_code }}</td>
                  <td class="p-3">
                    <div class="font-serif font-bold">{{ r.employee_name }}</div>
                    <div class="text-[10px] text-chausu">{{ r.employee_no }}・{{ r.dept_name }}</div>
                  </td>
                  <td class="p-3 font-serif font-medium">{{ r.item_name }}</td>
                  <td class="p-3 font-mono">
                    <span class="text-nadeshiko font-bold">-{{ r.deducted_points }} pt</span>
                    <span class="text-[10px] text-chausu block">NT$ {{ r.actual_cash_value }}</span>
                  </td>
                  <td class="p-3">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-serif" :class="statusBadgeClass(r.status)">
                      {{ statusLabel(r.status) }}
                    </span>
                  </td>
                  <td class="p-3 font-mono text-[10px] text-chausu">{{ formatDateTime(r.created_at) }}</td>
                  <td class="p-3 text-right whitespace-nowrap space-x-1">
                    <template v-if="r.type === 'INTERNAL_VOUCHER' && r.status === 'ACTIVE'">
                      <button
                        @click="updateRedemptionStatus(r, 'USED')"
                        class="px-2.5 py-1 rounded-pill bg-wakatake hover:bg-wakatake-dark text-white text-[11px] font-serif"
                      >
                        核銷
                      </button>
                      <button
                        @click="updateRedemptionStatus(r, 'REVOKED')"
                        class="px-2.5 py-1 rounded-pill bg-red-50 hover:bg-red-100 text-nadeshiko border border-red-200 text-[11px] font-serif"
                      >
                        作廢退點
                      </button>
                    </template>
                    <span v-else class="text-[10px] text-chausu font-serif">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ==================== TAB 5: 雙重記帳與稽核日誌 ==================== -->
      <section v-else-if="activeTab === 'audit'" class="space-y-4">
        <div class="bg-white p-4 rounded-2xl border border-shiraki-dark shadow-zen flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-2">
            <button
              @click="auditSubView = 'ledger'"
              class="px-4 py-1.5 rounded-pill text-xs font-serif transition-colors border"
              :class="
                auditSubView === 'ledger'
                  ? 'bg-wakatake text-white border-wakatake'
                  : 'bg-shiraki-light text-sumikuro border-shiraki-dark'
              "
            >
              雙重記帳流水帳 (point_ledger)
            </button>
            <button
              @click="auditSubView = 'logs'"
              class="px-4 py-1.5 rounded-pill text-xs font-serif transition-colors border"
              :class="
                auditSubView === 'logs'
                  ? 'bg-sumikuro text-white border-sumikuro'
                  : 'bg-shiraki-light text-sumikuro border-shiraki-dark'
              "
            >
              後台異動稽核軌跡 (audit_logs)
            </button>
          </div>

          <button
            @click="handleResetDemo"
            class="px-3.5 py-1.5 rounded-pill text-xs font-serif bg-red-50 hover:bg-red-100 text-nadeshiko border border-red-200 transition-colors"
          >
            🔄 重設全系統為初始演示資料
          </button>
        </div>

        <!-- Double-Entry Ledger Table -->
        <div v-if="auditSubView === 'ledger'" class="bg-white rounded-2xl border border-shiraki-dark shadow-zen overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-shiraki text-chausu font-serif text-[11px] border-b border-shiraki-dark">
                <tr>
                  <th class="p-3">序號</th>
                  <th class="p-3">員工</th>
                  <th class="p-3">交易類型</th>
                  <th class="p-3">變動點數</th>
                  <th class="p-3">餘額快照</th>
                  <th class="p-3">說明 / 冪等鍵</th>
                  <th class="p-3">時間</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-shiraki-dark/60">
                <tr v-for="entry in ledger" :key="entry.id" class="hover:bg-shiraki-light/40">
                  <td class="p-3 font-mono text-chausu">#{{ entry.id }}</td>
                  <td class="p-3 font-serif">
                    <span class="font-bold">{{ entry.employee_name || '同仁' }}</span>
                    <span class="block text-[10px] font-mono text-chausu">{{ entry.employee_no }}</span>
                  </td>
                  <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-semibold" :class="entry.points >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'">
                      {{ formatTxType(entry.transaction_type) }}
                    </span>
                  </td>
                  <td class="p-3 font-mono font-bold" :class="entry.points >= 0 ? 'text-wakatake' : 'text-nadeshiko'">
                    {{ entry.points > 0 ? '+' + entry.points : entry.points }} pt
                  </td>
                  <td class="p-3 font-mono font-semibold">{{ entry.balance_snapshot }} pt</td>
                  <td class="p-3 text-chausu max-w-xs">
                    <div class="truncate" :title="entry.notes">{{ entry.notes }}</div>
                    <div class="font-mono text-[10px] text-gray-400 truncate">{{ entry.idempotency_key }}</div>
                  </td>
                  <td class="p-3 font-mono text-[10px] text-chausu">{{ formatDateTime(entry.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Compliance Audit Logs -->
        <div v-else class="bg-white rounded-2xl border border-shiraki-dark shadow-zen overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-shiraki text-chausu font-serif text-[11px] border-b border-shiraki-dark">
                <tr>
                  <th class="p-3">時間</th>
                  <th class="p-3">操作人員</th>
                  <th class="p-3">動作 / 對象</th>
                  <th class="p-3">原因說明</th>
                  <th class="p-3">變更前後值</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-shiraki-dark/60">
                <tr v-if="auditLogs.length === 0">
                  <td colspan="5" class="p-6 text-center text-chausu font-serif">尚無後台稽核異動紀錄</td>
                </tr>
                <tr v-for="log in auditLogs" :key="log.id" class="hover:bg-shiraki-light/40">
                  <td class="p-3 font-mono text-[10px] text-chausu whitespace-nowrap">{{ formatDateTime(log.created_at) }}</td>
                  <td class="p-3 font-serif font-semibold">{{ log.actor }}</td>
                  <td class="p-3">
                    <span class="px-2 py-0.5 rounded bg-shiraki text-[10px] font-mono">{{ log.action }}</span>
                    <span class="block text-[10px] font-mono text-chausu mt-0.5">{{ log.target_type }}: {{ log.target_id }}</span>
                  </td>
                  <td class="p-3 font-serif">{{ log.reason }}</td>
                  <td class="p-3 font-mono text-[10px] text-chausu max-w-xs">
                    <div v-if="log.before_val">前: {{ JSON.stringify(log.before_val) }}</div>
                    <div v-if="log.after_val" class="text-wakatake-dark">後: {{ JSON.stringify(log.after_val) }}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>

    <!-- ==================== MODAL: 新增 / 編輯會員 ==================== -->
    <div v-if="userModal.open" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sumikuro/50 backdrop-blur-sm" @click.self="userModal.open = false">
      <div class="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-shiraki-dark space-y-4">
        <div class="flex items-center justify-between border-b border-shiraki-dark pb-3">
          <h3 class="font-serif font-bold text-base">{{ userModal.isEdit ? '編輯同仁會員資料' : '新增院內同仁會員' }}</h3>
          <button @click="userModal.open = false" class="text-chausu hover:text-sumikuro">✕</button>
        </div>

        <form @submit.prevent="submitUserModal" class="space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-serif mb-1">員工工號 *</label>
              <input v-model.trim="userModal.form.employee_no" :disabled="userModal.isEdit" required placeholder="例：E3001" class="w-full h-10 px-3 rounded-xl bg-washi border border-shiraki-dark font-mono uppercase disabled:opacity-60" />
            </div>
            <div>
              <label class="block font-serif mb-1">姓名 *</label>
              <input v-model.trim="userModal.form.name" required placeholder="例：王小美" class="w-full h-10 px-3 rounded-xl bg-washi border border-shiraki-dark" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-serif mb-1">所屬部門 *</label>
              <input v-model.trim="userModal.form.dept_code" required placeholder="例：內科加護病房" class="w-full h-10 px-3 rounded-xl bg-washi border border-shiraki-dark" />
            </div>
            <div>
              <label class="block font-serif mb-1">系統角色</label>
              <select v-model="userModal.form.role" class="w-full h-10 px-3 rounded-xl bg-washi border border-shiraki-dark">
                <option value="STAFF">STAFF (醫護同仁)</option>
                <option value="ADMIN">ADMIN (系統管理員)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-serif mb-1">RFID 識別證內碼</label>
              <input v-model.trim="userModal.form.card_uid" placeholder="例：CARD-CSH-3001" class="w-full h-10 px-3 rounded-xl bg-washi border border-shiraki-dark font-mono" />
            </div>
            <div>
              <label class="block font-serif mb-1">LINE UID</label>
              <input v-model.trim="userModal.form.line_user_id" placeholder="選填" class="w-full h-10 px-3 rounded-xl bg-washi border border-shiraki-dark font-mono" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-serif mb-1">{{ userModal.isEdit ? '重設密碼（留空不改）' : '初始密碼' }}</label>
              <input v-model="userModal.form.password" :placeholder="userModal.isEdit ? '不修改請留空' : '預設 csh1234'" class="w-full h-10 px-3 rounded-xl bg-washi border border-shiraki-dark" />
            </div>
            <div v-if="!userModal.isEdit">
              <label class="block font-serif mb-1">開戶初始點數</label>
              <input v-model.number="userModal.form.initial_points" type="number" min="0" class="w-full h-10 px-3 rounded-xl bg-washi border border-shiraki-dark font-mono" />
            </div>
          </div>

          <div v-if="userModal.error" class="p-2.5 rounded-xl bg-nadeshiko/10 text-nadeshiko">{{ userModal.error }}</div>

          <div class="pt-2 flex justify-end gap-2">
            <button type="button" @click="userModal.open = false" class="px-4 py-2 rounded-pill bg-shiraki border border-shiraki-dark font-serif">取消</button>
            <button type="submit" class="px-5 py-2 rounded-pill bg-wakatake hover:bg-wakatake-dark text-white font-serif">確認儲存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ==================== MODAL: 調整會員點數 ==================== -->
    <div v-if="pointsModal.open" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sumikuro/50 backdrop-blur-sm" @click.self="pointsModal.open = false">
      <div class="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-shiraki-dark space-y-4 text-xs">
        <div class="flex items-center justify-between border-b border-shiraki-dark pb-3">
          <h3 class="font-serif font-bold text-sm">調整點數：{{ pointsModal.user?.name }}</h3>
          <button @click="pointsModal.open = false" class="text-chausu hover:text-sumikuro">✕</button>
        </div>

        <div class="p-3 rounded-xl bg-shiraki-light border border-shiraki-dark flex justify-between">
          <span class="font-serif text-chausu">目前餘額</span>
          <span class="font-mono font-bold text-wakatake">{{ pointsModal.user?.current_balance }} pt</span>
        </div>

        <form @submit.prevent="submitPointsModal" class="space-y-3">
          <div>
            <label class="block font-serif mb-1">調整方式</label>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" @click="pointsModal.mode = 'DELTA'" class="py-2 rounded-xl border font-serif" :class="pointsModal.mode === 'DELTA' ? 'bg-wakatake text-white border-wakatake' : 'bg-washi border-shiraki-dark'">增減差額 (+/-)</button>
              <button type="button" @click="pointsModal.mode = 'SET'" class="py-2 rounded-xl border font-serif" :class="pointsModal.mode === 'SET' ? 'bg-wakatake text-white border-wakatake' : 'bg-washi border-shiraki-dark'">直接設定餘額</button>
            </div>
          </div>
          <div>
            <label class="block font-serif mb-1">{{ pointsModal.mode === 'DELTA' ? '增減點數（負數為扣點）' : '目標點數餘額' }}</label>
            <input v-model.number="pointsModal.amount" type="number" required class="w-full h-10 px-3 rounded-xl bg-washi border border-shiraki-dark font-mono" />
          </div>
          <div>
            <label class="block font-serif mb-1">調整原因（將寫入稽核日誌）*</label>
            <input v-model.trim="pointsModal.reason" required placeholder="例：健康講座講師加點補登" class="w-full h-10 px-3 rounded-xl bg-washi border border-shiraki-dark" />
          </div>

          <div class="pt-2 flex justify-end gap-2">
            <button type="button" @click="pointsModal.open = false" class="px-4 py-2 rounded-pill bg-shiraki border border-shiraki-dark font-serif">取消</button>
            <button type="submit" class="px-5 py-2 rounded-pill bg-wakatake text-white font-serif">確認入帳</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ==================== MODAL: 調整健康樹 ==================== -->
    <div v-if="treeModal.open" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sumikuro/50 backdrop-blur-sm" @click.self="treeModal.open = false">
      <div class="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-shiraki-dark space-y-4 text-xs">
        <div class="flex items-center justify-between border-b border-shiraki-dark pb-3">
          <h3 class="font-serif font-bold text-sm">調整健康樹：{{ treeModal.user?.name }}</h3>
          <button @click="treeModal.open = false" class="text-chausu hover:text-sumikuro">✕</button>
        </div>
        <form @submit.prevent="submitTreeModal" class="space-y-3">
          <div>
            <label class="block font-serif mb-1">累積經驗值 (EXP)（0=Lv.1, 51=Lv.2, 151=Lv.3, 301=Lv.4, 501=Lv.5）</label>
            <input v-model.number="treeModal.exp" type="number" min="0" required class="w-full h-10 px-3 rounded-xl bg-washi border border-shiraki-dark font-mono" />
          </div>
          <div>
            <label class="block font-serif mb-1">待澆灌露水 (滴)</label>
            <input v-model.number="treeModal.dew" type="number" min="0" required class="w-full h-10 px-3 rounded-xl bg-washi border border-shiraki-dark font-mono" />
          </div>
          <div class="pt-2 flex justify-end gap-2">
            <button type="button" @click="treeModal.open = false" class="px-4 py-2 rounded-pill bg-shiraki border border-shiraki-dark font-serif">取消</button>
            <button type="submit" class="px-5 py-2 rounded-pill bg-wakatake text-white font-serif">更新狀態</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ==================== MODAL: 新增 / 編輯日嚐好物 ==================== -->
    <div v-if="catalogModal.open" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sumikuro/50 backdrop-blur-sm" @click.self="catalogModal.open = false">
      <div class="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-shiraki-dark space-y-4 text-xs">
        <div class="flex items-center justify-between border-b border-shiraki-dark pb-3">
          <h3 class="font-serif font-bold text-base">{{ catalogModal.isEdit ? '編輯日嚐好物' : '新增日嚐好物' }}</h3>
          <button @click="catalogModal.open = false" class="text-chausu hover:text-sumikuro">✕</button>
        </div>

        <form @submit.prevent="submitCatalogModal" class="space-y-3">
          <div class="grid grid-cols-4 gap-3">
            <div>
              <label class="block font-serif mb-1">圖示</label>
              <input v-model.trim="catalogModal.form.icon" placeholder="🎁" class="w-full h-10 px-3 text-center text-lg rounded-xl bg-washi border border-shiraki-dark" />
            </div>
            <div class="col-span-3">
              <label class="block font-serif mb-1">好物名稱 *</label>
              <input v-model.trim="catalogModal.form.name" required placeholder="例：竹山桂竹筍和風便當兌換券" class="w-full h-10 px-3 rounded-xl bg-washi border border-shiraki-dark" />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block font-serif mb-1">所需點數 (pt) *</label>
              <input v-model.number="catalogModal.form.points" type="number" min="1" required class="w-full h-10 px-3 rounded-xl bg-washi border border-shiraki-dark font-mono" />
            </div>
            <div>
              <label class="block font-serif mb-1">等值現金 (NT$)</label>
              <input v-model.number="catalogModal.form.cashValue" type="number" min="0" required class="w-full h-10 px-3 rounded-xl bg-washi border border-shiraki-dark font-mono" />
            </div>
            <div>
              <label class="block font-serif mb-1">庫存數量</label>
              <input v-model.number="catalogModal.form.stock" type="number" min="0" required class="w-full h-10 px-3 rounded-xl bg-washi border border-shiraki-dark font-mono" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-serif mb-1">好物分類</label>
              <select v-model="catalogModal.form.category" class="w-full h-10 px-3 rounded-xl bg-washi border border-shiraki-dark">
                <option value="MEAL">日嚐餐飲 (MEAL)</option>
                <option value="SPORTS">運動用品 (SPORTS)</option>
                <option value="LOCAL">竹山在地物產 (LOCAL)</option>
                <option value="WELLNESS">身心舒壓 (WELLNESS)</option>
              </select>
            </div>
            <div class="flex items-end pb-2">
              <label class="flex items-center gap-2 cursor-pointer font-serif">
                <input v-model="catalogModal.form.is_active" type="checkbox" class="w-4 h-4 accent-wakatake" />
                <span>立即上架顯示於前台</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block font-serif mb-1">商品說明</label>
            <textarea v-model.trim="catalogModal.form.description" rows="3" placeholder="說明使用方式與兌換細節..." class="w-full p-3 rounded-xl bg-washi border border-shiraki-dark"></textarea>
          </div>

          <div class="pt-2 flex justify-end gap-2">
            <button type="button" @click="catalogModal.open = false" class="px-4 py-2 rounded-pill bg-shiraki border border-shiraki-dark font-serif">取消</button>
            <button type="submit" class="px-5 py-2 rounded-pill bg-wakatake hover:bg-wakatake-dark text-white font-serif">確認儲存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ==================== MODAL: 新增 / 編輯運動項目 ==================== -->
    <div v-if="sportModal.open" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sumikuro/50 backdrop-blur-sm" @click.self="sportModal.open = false">
      <div class="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-shiraki-dark space-y-4 text-xs">
        <div class="flex items-center justify-between border-b border-shiraki-dark pb-3">
          <h3 class="font-serif font-bold text-base">{{ sportModal.isEdit ? '編輯運動項目' : '新增運動項目' }}</h3>
          <button @click="sportModal.open = false" class="text-chausu hover:text-sumikuro">✕</button>
        </div>

        <form @submit.prevent="submitSportModal" class="space-y-3">
          <div class="grid grid-cols-4 gap-3">
            <div>
              <label class="block font-serif mb-1">圖示</label>
              <input v-model.trim="sportModal.form.icon" placeholder="🏃" class="w-full h-10 px-3 text-center text-lg rounded-xl bg-washi border border-shiraki-dark" />
            </div>
            <div class="col-span-3">
              <label class="block font-serif mb-1">運動項目名稱 *</label>
              <input v-model.trim="sportModal.form.name" required placeholder="例：跑步機有氧訓練" class="w-full h-10 px-3 rounded-xl bg-washi border border-shiraki-dark" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-serif mb-1">運動分類</label>
              <select v-model="sportModal.form.category" class="w-full h-10 px-3 rounded-xl bg-washi border border-shiraki-dark">
                <option value="CARDIO">有氧運動 (CARDIO)</option>
                <option value="STRENGTH">肌力訓練 (STRENGTH)</option>
                <option value="FLEXIBILITY">伸展放鬆 (FLEXIBILITY)</option>
                <option value="GROUP">團體課程 (GROUP)</option>
              </select>
            </div>
            <div>
              <label class="block font-serif mb-1">運動場域 *</label>
              <input v-model.trim="sportModal.form.location" required placeholder="例：體能教室 A 區" class="w-full h-10 px-3 rounded-xl bg-washi border border-shiraki-dark" />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block font-serif mb-1">達標時長 (分) *</label>
              <input v-model.number="sportModal.form.min_duration_mins" type="number" min="1" required class="w-full h-10 px-3 rounded-xl bg-washi border border-shiraki-dark font-mono" />
            </div>
            <div>
              <label class="block font-serif mb-1">獎勵點數 (pt) *</label>
              <input v-model.number="sportModal.form.reward_points" type="number" min="0" required class="w-full h-10 px-3 rounded-xl bg-washi border border-shiraki-dark font-mono" />
            </div>
            <div>
              <label class="block font-serif mb-1">獎勵露水 (滴) *</label>
              <input v-model.number="sportModal.form.reward_dew" type="number" min="0" required class="w-full h-10 px-3 rounded-xl bg-washi border border-shiraki-dark font-mono" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-serif mb-1">使用人數模式 *</label>
              <select v-model="sportModal.form.usage_mode" class="w-full h-10 px-3 rounded-xl bg-washi border border-shiraki-dark">
                <option value="MULTI">可同時多人使用 (MULTI)</option>
                <option value="SINGLE">同時間只能一人使用 (SINGLE)</option>
              </select>
            </div>
            <div>
              <label class="block font-serif mb-1">當日次數上限 (次/人) *</label>
              <input v-model.number="sportModal.form.daily_limit" type="number" min="0" required placeholder="0 代表不限次數" class="w-full h-10 px-3 rounded-xl bg-washi border border-shiraki-dark font-mono" />
              <p class="text-[10px] text-chausu mt-0.5">0 表示不限次數；例：1 代表當日不得超過 1 次</p>
            </div>
          </div>

          <div>
            <label class="block font-serif mb-1">專屬 QR Code</label>
            <input v-model.trim="sportModal.form.qr_code" placeholder="留空將自動產生 CSH-SPORT-..." class="w-full h-10 px-3 rounded-xl bg-washi border border-shiraki-dark font-mono" />
          </div>

          <div class="flex items-center">
            <label class="flex items-center gap-2 cursor-pointer font-serif">
              <input v-model="sportModal.form.is_active" type="checkbox" class="w-4 h-4 accent-wakatake" />
              <span>立即啟用並開放體能教室門禁選用</span>
            </label>
          </div>

          <div>
            <label class="block font-serif mb-1">項目說明</label>
            <textarea v-model.trim="sportModal.form.description" rows="3" placeholder="說明訓練內容、器材注意事項與獎勵規範..." class="w-full p-3 rounded-xl bg-washi border border-shiraki-dark"></textarea>
          </div>

          <div class="pt-2 flex justify-end gap-2">
            <button type="button" @click="sportModal.open = false" class="px-4 py-2 rounded-pill bg-shiraki border border-shiraki-dark font-serif">取消</button>
            <button type="submit" class="px-5 py-2 rounded-pill bg-wakatake hover:bg-wakatake-dark text-white font-serif">確認儲存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ==================== MODAL: 運動項目專屬 QR Code ==================== -->
    <div v-if="sportQrModal.open && sportQrModal.sport" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sumikuro/50 backdrop-blur-sm" @click.self="sportQrModal.open = false">
      <div class="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-shiraki-dark text-center space-y-4">
        <div class="flex items-center justify-between border-b border-shiraki-dark pb-3">
          <div class="text-left">
            <span class="text-[10px] font-serif text-wakatake font-semibold">體能教室專屬門禁 QR Code</span>
            <h3 class="font-serif font-bold text-base text-sumikuro">
              {{ sportQrModal.sport.icon }} {{ sportQrModal.sport.name }}
            </h3>
          </div>
          <button @click="sportQrModal.open = false" class="text-chausu hover:text-sumikuro text-lg">✕</button>
        </div>

        <div class="flex flex-col items-center py-2">
          <div class="p-3 bg-white border-2 border-dashed border-shiraki-dark rounded-xl shadow-inner">
            <img v-if="sportQrModal.imageUrl" :src="sportQrModal.imageUrl" alt="Sport QR Code" class="w-48 h-48 object-contain" />
            <div v-else class="w-48 h-48 flex items-center justify-center text-xs text-chausu">正在產生條碼...</div>
          </div>

          <div class="mt-3 space-y-1.5">
            <div class="font-mono text-xs font-bold tracking-wider bg-shiraki-light px-3 py-1 rounded-lg border border-shiraki-dark text-sumikuro">
              {{ sportQrModal.sport.qr_code }}
            </div>
            <div class="text-[11px] text-chausu font-serif">
              📍 {{ sportQrModal.sport.location }}・{{ sportQrModal.sport.usage_mode === 'SINGLE' ? '👤 同時間只能一人使用' : '👥 可同時多人使用' }}
            </div>
            <div class="text-[11px] text-wakatake font-serif">
              達標 {{ sportQrModal.sport.min_duration_mins }} 分鐘・+{{ sportQrModal.sport.reward_points }} pt / +{{ sportQrModal.sport.reward_dew }} 滴・{{ (sportQrModal.sport.daily_limit ?? 1) === 0 ? '當日不限次數' : `當日限 ${sportQrModal.sport.daily_limit ?? 1} 次` }}
            </div>
          </div>
        </div>

        <div class="flex gap-2 pt-2 border-t border-shiraki-dark">
          <a
            v-if="sportQrModal.imageUrl"
            :href="sportQrModal.imageUrl"
            :download="`${sportQrModal.sport.qr_code}.png`"
            class="flex-1 py-2 rounded-pill bg-wakatake hover:bg-wakatake-dark text-white text-xs font-serif text-center"
          >
            📥 下載 QR 圖檔
          </a>
          <button
            @click="sportQrModal.open = false"
            class="flex-1 py-2 rounded-pill bg-shiraki hover:bg-shiraki-dark text-sumikuro text-xs font-serif border border-shiraki-dark"
          >
            關閉視窗
          </button>
        </div>
      </div>
    </div>

    <!-- Modal 6: Create/Edit Habit Task -->
    <div
      v-if="habitTaskModal.open"
      class="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 border border-shiraki-dark shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-shiraki-dark pb-3">
          <h3 class="font-serif font-bold text-base text-sumikuro">
            {{ habitTaskModal.isEdit ? '編輯日常修養任務' : '新增日常修養任務' }}
          </h3>
          <button @click="habitTaskModal.open = false" class="text-chausu hover:text-sumikuro">✕</button>
        </div>

        <form @submit.prevent="submitHabitTaskModal" class="space-y-3 text-xs font-serif">
          <div class="grid grid-cols-4 gap-3">
            <div>
              <label class="block text-chausu mb-1">圖示</label>
              <input v-model="habitTaskModal.form.icon" type="text" class="w-full px-3 py-2 rounded-xl bg-shiraki-light border border-shiraki-dark text-center text-base" />
            </div>
            <div>
              <label class="block text-chausu mb-1">排序 *</label>
              <input v-model.number="habitTaskModal.form.sort_order" type="number" min="1" required class="w-full px-3 py-2 rounded-xl bg-shiraki-light border border-shiraki-dark font-mono" />
            </div>
            <div class="col-span-2">
              <label class="block text-chausu mb-1">修養分類 *</label>
              <input v-model="habitTaskModal.form.category" type="text" required placeholder="例如：日嚐、習藝、養身、行健" class="w-full px-3 py-2 rounded-xl bg-shiraki-light border border-shiraki-dark" />
            </div>
          </div>

          <div>
            <label class="block text-chausu mb-1">任務名稱 *</label>
            <input v-model="habitTaskModal.form.title" type="text" required placeholder="例：蔬食之日 / 每日飲水 2000cc" class="w-full px-3 py-2 rounded-xl bg-shiraki-light border border-shiraki-dark" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-chausu mb-1">獎勵點數 (pt) *</label>
              <input v-model.number="habitTaskModal.form.points_reward" type="number" min="0" required class="w-full px-3 py-2 rounded-xl bg-shiraki-light border border-shiraki-dark font-mono" />
            </div>
            <div>
              <label class="block text-chausu mb-1">獎勵露水 (滴) *</label>
              <input v-model.number="habitTaskModal.form.dew_reward" type="number" min="0" required class="w-full px-3 py-2 rounded-xl bg-shiraki-light border border-shiraki-dark font-mono" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-chausu mb-1">系統連動鍵值 *</label>
              <select v-model="habitTaskModal.form.habit_key" class="w-full px-3 py-2 rounded-xl bg-shiraki-light border border-shiraki-dark">
                <option value="CUSTOM">CUSTOM (員工自主打卡)</option>
                <option value="VEGETARIAN">VEGETARIAN (員工餐廳 POS)</option>
                <option value="EDUCATION">EDUCATION (人資教學系統)</option>
                <option value="CHECKUP">CHECKUP (檢驗科 HIS 健檢)</option>
                <option value="GYM">GYM (體能教室門禁)</option>
              </select>
            </div>
            <div>
              <label class="block text-chausu mb-1">來源顯示名稱</label>
              <input v-model="habitTaskModal.form.source_type" type="text" placeholder="例：POS感應刷卡 / 自主打卡回報" class="w-full px-3 py-2 rounded-xl bg-shiraki-light border border-shiraki-dark" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-chausu mb-1">達成狀態提示文字</label>
              <input v-model="habitTaskModal.form.completed_status_text" type="text" placeholder="今日已達成" class="w-full px-3 py-2 rounded-xl bg-shiraki-light border border-shiraki-dark" />
            </div>
            <div>
              <label class="block text-chausu mb-1">未完成狀態提示文字</label>
              <input v-model="habitTaskModal.form.pending_status_text" type="text" placeholder="尚未完成" class="w-full px-3 py-2 rounded-xl bg-shiraki-light border border-shiraki-dark" />
            </div>
          </div>

          <label class="flex items-center gap-2 cursor-pointer pt-1">
            <input type="checkbox" v-model="habitTaskModal.form.is_active" class="w-4 h-4 accent-wakatake" />
            <span>立即啟用並顯示於員工「日常修養」任務清單</span>
          </label>

          <div>
            <label class="block text-chausu mb-1">任務說明</label>
            <textarea v-model="habitTaskModal.form.description" rows="2" placeholder="輸入同仁可見的修養說明與達成條件..." class="w-full px-3 py-2 rounded-xl bg-shiraki-light border border-shiraki-dark"></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t border-shiraki-dark">
            <button type="button" @click="habitTaskModal.open = false" class="px-4 py-2 rounded-pill bg-shiraki text-sumikuro">取消</button>
            <button type="submit" class="px-5 py-2 rounded-pill bg-wakatake text-white font-semibold">確認儲存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import QRCode from 'qrcode';
import { apiFetch } from '../utils/api.js';

defineProps({
  currentUser: Object
});

const emit = defineEmits(['back-to-frontend', 'logout', 'data-updated']);

const tabs = [
  { id: 'overview', icon: '📈', label: '營運總覽' },
  { id: 'members', icon: '👥', label: '會員管理' },
  { id: 'catalog', icon: '🎁', label: '日嚐好物管理' },
  { id: 'sports', icon: '🏃', label: '運動項目維護' },
  { id: 'habitTasks', icon: '📋', label: '日常修養任務' },
  { id: 'redemptions', icon: '🎟️', label: '福利券與公益' },
  { id: 'audit', icon: '📜', label: '帳本與稽核日誌' }
];

const activeTab = ref('overview');
const toastMessage = ref('');

// Data states
const overview = ref({});
const users = ref([]);
const memberSearch = ref('');
const catalogItems = ref([]);
const sportItems = ref([]);
const sportSearch = ref('');
const habitTasks = ref([]);
const redemptions = ref([]);
const redemptionFilter = ref('ALL');
const charityReport = ref({});
const ledger = ref([]);
const auditLogs = ref([]);
const auditSubView = ref('ledger');

// Modals
const userModal = ref({
  open: false,
  isEdit: false,
  editId: null,
  error: '',
  form: { employee_no: '', name: '', dept_code: '', card_uid: '', line_user_id: '', role: 'STAFF', password: '', initial_points: 100 }
});

const pointsModal = ref({
  open: false,
  user: null,
  mode: 'DELTA',
  amount: 50,
  reason: '管理員手動補登獎勵'
});

const treeModal = ref({
  open: false,
  user: null,
  exp: 0,
  dew: 0
});

const catalogModal = ref({
  open: false,
  isEdit: false,
  editId: null,
  form: { name: '', points: 50, cashValue: 50, category: 'LOCAL', icon: '🎁', stock: 50, is_active: true, description: '' }
});

const sportModal = ref({
  open: false,
  isEdit: false,
  editId: null,
  form: {
    name: '',
    category: 'CARDIO',
    location: '體能教室 A 區',
    min_duration_mins: 30,
    reward_points: 1,
    reward_dew: 1,
    icon: '🏃',
    qr_code: '',
    usage_mode: 'MULTI',
    daily_limit: 1,
    is_active: true,
    description: ''
  }
});

const sportQrModal = ref({
  open: false,
  sport: null,
  imageUrl: ''
});

const habitTaskModal = ref({
  open: false,
  isEdit: false,
  editId: null,
  form: {
    category: '修心',
    title: '',
    description: '',
    icon: '🌿',
    points_reward: 1,
    dew_reward: 1,
    source_type: '自主打卡回報',
    habit_key: 'CUSTOM',
    sort_order: 5,
    completed_status_text: '今日已達成',
    pending_status_text: '尚未完成',
    is_active: true
  }
});

const filteredRedemptions = computed(() => {
  if (redemptionFilter.value === 'ALL') return redemptions.value;
  return redemptions.value.filter(r => r.status === redemptionFilter.value);
});

onMounted(() => {
  loadAllAdminData();
});

function showToast(msg) {
  toastMessage.value = msg;
  setTimeout(() => {
    if (toastMessage.value === msg) toastMessage.value = '';
  }, 3500);
}

async function switchTab(tabId) {
  activeTab.value = tabId;
  await loadTabData(tabId);
}

async function loadAllAdminData() {
  await Promise.all([
    loadOverview(),
    loadUsers(),
    loadCatalog(),
    loadSports(),
    loadHabitTasks(),
    loadRedemptions(),
    loadCharityReport(),
    loadLedger(),
    loadAuditLogs()
  ]);
}

async function loadTabData(tabId) {
  if (tabId === 'overview') await loadOverview();
  if (tabId === 'members') await loadUsers();
  if (tabId === 'catalog') await loadCatalog();
  if (tabId === 'sports') await loadSports();
  if (tabId === 'habitTasks') await loadHabitTasks();
  if (tabId === 'redemptions') await Promise.all([loadRedemptions(), loadCharityReport()]);
  if (tabId === 'audit') await Promise.all([loadLedger(), loadAuditLogs()]);
}

async function loadOverview() {
  const res = await apiFetch('/api/v1/admin/overview');
  const result = await res.json();
  if (result.code === 200) overview.value = result.data || {};
}

async function loadUsers() {
  const q = encodeURIComponent(memberSearch.value.trim());
  const res = await apiFetch(`/api/v1/admin/users${q ? `?q=${q}` : ''}`);
  const result = await res.json();
  if (result.code === 200) users.value = result.data || [];
}

async function loadCatalog() {
  const res = await apiFetch('/api/v1/admin/catalog');
  const result = await res.json();
  if (result.code === 200) catalogItems.value = result.data || [];
}

async function loadSports() {
  const q = encodeURIComponent(sportSearch.value.trim());
  const res = await apiFetch(`/api/v1/admin/sports${q ? `?q=${q}` : ''}`);
  const result = await res.json();
  if (result.code === 200) sportItems.value = result.data || [];
}

async function loadHabitTasks() {
  const res = await apiFetch('/api/v1/admin/habit-tasks');
  const result = await res.json();
  if (result.code === 200) habitTasks.value = result.data || [];
}

async function loadRedemptions() {
  const res = await apiFetch('/api/v1/admin/redemptions');
  const result = await res.json();
  if (result.code === 200) redemptions.value = result.data || [];
}

async function loadCharityReport() {
  const res = await apiFetch('/api/v1/admin/charity-report');
  const result = await res.json();
  if (result.code === 200) charityReport.value = result.data || {};
}

async function loadLedger() {
  const res = await apiFetch('/api/v1/admin/ledger');
  const result = await res.json();
  if (result.code === 200) ledger.value = result.data || [];
}

async function loadAuditLogs() {
  const res = await apiFetch('/api/v1/admin/audit-logs');
  const result = await res.json();
  if (result.code === 200) auditLogs.value = result.data || [];
}

// Member actions
function openCreateUserModal() {
  userModal.value = {
    open: true,
    isEdit: false,
    editId: null,
    error: '',
    form: { employee_no: '', name: '', dept_code: '', card_uid: '', line_user_id: '', role: 'STAFF', password: '', initial_points: 100 }
  };
}

function openEditUserModal(u) {
  userModal.value = {
    open: true,
    isEdit: true,
    editId: u.id,
    error: '',
    form: {
      employee_no: u.employee_no,
      name: u.name,
      dept_code: u.dept_code,
      card_uid: u.card_uid || '',
      line_user_id: u.line_user_id || '',
      role: u.role,
      password: '',
      initial_points: u.current_balance
    }
  };
}

async function submitUserModal() {
  userModal.value.error = '';
  const f = userModal.value.form;
  const url = userModal.value.isEdit ? `/api/v1/admin/users/${userModal.value.editId}` : '/api/v1/admin/users';
  const method = userModal.value.isEdit ? 'PATCH' : 'POST';

  const res = await apiFetch(url, { method, body: JSON.stringify(f) });
  const result = await res.json();
  if (result.code === 200) {
    userModal.value.open = false;
    showToast(result.message);
    await loadAllAdminData();
    emit('data-updated');
  } else {
    userModal.value.error = result.message || '操作失敗';
  }
}

async function toggleUserActive(u) {
  const res = await apiFetch(`/api/v1/admin/users/${u.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      is_active: !u.is_active,
      reason: !u.is_active ? '後台重新啟用帳號' : '後台停用帳號'
    })
  });
  const result = await res.json();
  if (result.code === 200) {
    showToast(`${u.name} 帳號已${!u.is_active ? '啟用' : '停用'}`);
    await loadAllAdminData();
  } else {
    alert(result.message);
  }
}

function openAdjustPointsModal(u) {
  pointsModal.value = {
    open: true,
    user: u,
    mode: 'DELTA',
    amount: 50,
    reason: '職安衛健康活動加點獎勵'
  };
}

async function submitPointsModal() {
  const res = await apiFetch(`/api/v1/admin/users/${pointsModal.value.user.id}/adjust-points`, {
    method: 'POST',
    body: JSON.stringify({
      mode: pointsModal.value.mode,
      amount: pointsModal.value.amount,
      reason: pointsModal.value.reason
    })
  });
  const result = await res.json();
  if (result.code === 200) {
    pointsModal.value.open = false;
    showToast(result.message);
    await loadAllAdminData();
    emit('data-updated');
  } else {
    alert(result.message);
  }
}

function openAdjustTreeModal(u) {
  treeModal.value = {
    open: true,
    user: u,
    exp: u.tree?.total_exp || 0,
    dew: u.tree?.pending_dew || 0
  };
}

async function submitTreeModal() {
  const res = await apiFetch(`/api/v1/admin/users/${treeModal.value.user.id}/adjust-tree`, {
    method: 'POST',
    body: JSON.stringify({
      exp: treeModal.value.exp,
      dew: treeModal.value.dew
    })
  });
  const result = await res.json();
  if (result.code === 200) {
    treeModal.value.open = false;
    showToast(result.message);
    await loadAllAdminData();
    emit('data-updated');
  } else {
    alert(result.message);
  }
}

// Catalog actions
function openCreateCatalogModal() {
  catalogModal.value = {
    open: true,
    isEdit: false,
    editId: null,
    form: { name: '', points: 50, cashValue: 50, category: 'LOCAL', icon: '🎁', stock: 50, is_active: true, description: '' }
  };
}

function openEditCatalogModal(item) {
  catalogModal.value = {
    open: true,
    isEdit: true,
    editId: item.id,
    form: {
      name: item.name,
      points: item.points,
      cashValue: item.cashValue,
      category: item.category || 'LOCAL',
      icon: item.icon || '🎁',
      stock: item.stock ?? 50,
      is_active: item.is_active !== false,
      description: item.description || ''
    }
  };
}

async function submitCatalogModal() {
  const f = catalogModal.value.form;
  const url = catalogModal.value.isEdit ? `/api/v1/admin/catalog/${catalogModal.value.editId}` : '/api/v1/admin/catalog';
  const method = catalogModal.value.isEdit ? 'PATCH' : 'POST';
  const res = await apiFetch(url, { method, body: JSON.stringify(f) });
  const result = await res.json();
  if (result.code === 200) {
    catalogModal.value.open = false;
    showToast(result.message);
    await loadAllAdminData();
    emit('data-updated');
  } else {
    alert(result.message);
  }
}

async function toggleCatalogActive(item) {
  const nextState = item.is_active === false;
  const res = await apiFetch(`/api/v1/admin/catalog/${item.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: nextState })
  });
  const result = await res.json();
  if (result.code === 200) {
    showToast(`「${item.name}」已${nextState ? '上架' : '下架'}`);
    await loadAllAdminData();
    emit('data-updated');
  }
}

async function deleteCatalogItem(item) {
  if (!confirm(`確定要刪除日嚐好物「${item.name}」嗎？`)) return;
  const res = await apiFetch(`/api/v1/admin/catalog/${item.id}`, { method: 'DELETE' });
  const result = await res.json();
  if (result.code === 200) {
    showToast(result.message);
    await loadAllAdminData();
    emit('data-updated');
  }
}

// Sport items actions
function openCreateSportModal() {
  sportModal.value = {
    open: true,
    isEdit: false,
    editId: null,
    form: {
      name: '',
      category: 'CARDIO',
      location: '體能教室 A 區',
      min_duration_mins: 30,
      reward_points: 1,
      reward_dew: 1,
      icon: '🏃',
      qr_code: '',
      usage_mode: 'MULTI',
      daily_limit: 1,
      is_active: true,
      description: ''
    }
  };
}

function openEditSportModal(sport) {
  sportModal.value = {
    open: true,
    isEdit: true,
    editId: sport.id,
    form: {
      name: sport.name,
      category: sport.category || 'CARDIO',
      location: sport.location || '體能教室',
      min_duration_mins: sport.min_duration_mins ?? 30,
      reward_points: sport.reward_points ?? 1,
      reward_dew: sport.reward_dew ?? 1,
      icon: sport.icon || '🏃',
      qr_code: sport.qr_code || '',
      usage_mode: sport.usage_mode === 'SINGLE' ? 'SINGLE' : 'MULTI',
      daily_limit: sport.daily_limit ?? 1,
      is_active: sport.is_active !== false,
      description: sport.description || ''
    }
  };
}

async function openSportQrModal(sport) {
  sportQrModal.value = {
    open: true,
    sport,
    imageUrl: ''
  };
  try {
    sportQrModal.value.imageUrl = await QRCode.toDataURL(sport.qr_code, {
      width: 240,
      margin: 1,
      color: {
        dark: '#2B2D2F',
        light: '#FFFFFF'
      }
    });
  } catch (err) {
    console.error('Failed to generate sport QR Code:', err);
  }
}

async function submitSportModal() {
  const f = sportModal.value.form;
  const url = sportModal.value.isEdit ? `/api/v1/admin/sports/${sportModal.value.editId}` : '/api/v1/admin/sports';
  const method = sportModal.value.isEdit ? 'PATCH' : 'POST';
  const res = await apiFetch(url, { method, body: JSON.stringify(f) });
  const result = await res.json();
  if (result.code === 200) {
    sportModal.value.open = false;
    showToast(result.message);
    await loadAllAdminData();
    emit('data-updated');
  } else {
    alert(result.message);
  }
}

async function toggleSportActive(sport) {
  const nextState = sport.is_active === false;
  const res = await apiFetch(`/api/v1/admin/sports/${sport.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: nextState })
  });
  const result = await res.json();
  if (result.code === 200) {
    showToast(`運動項目「${sport.name}」已${nextState ? '啟用' : '停用'}`);
    await loadAllAdminData();
    emit('data-updated');
  }
}

async function deleteSportItem(sport) {
  if (!confirm(`確定要刪除運動項目「${sport.name}」嗎？`)) return;
  const res = await apiFetch(`/api/v1/admin/sports/${sport.id}`, { method: 'DELETE' });
  const result = await res.json();
  if (result.code === 200) {
    showToast(result.message);
    await loadAllAdminData();
    emit('data-updated');
  }
}

function sportCategoryLabel(cat) {
  const map = {
    CARDIO: '有氧運動',
    STRENGTH: '肌力訓練',
    FLEXIBILITY: '伸展放鬆',
    GROUP: '團體課程'
  };
  return map[cat] || cat;
}

// Habit tasks actions
function formatChineseTaskBadge(task, index) {
  const numerals = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  const prefix = numerals[index] || `${index + 1}`;
  return `${prefix}・${task.category || '修養'}`;
}

function habitKeyLabel(key) {
  const map = {
    VEGETARIAN: 'POS 蔬食刷卡',
    EDUCATION: '人資教育課程',
    CHECKUP: 'HIS 健檢癌篩',
    GYM: '體能教室門禁',
    CUSTOM: '自主打卡任務'
  };
  return map[key] || key;
}

function openCreateHabitTaskModal() {
  habitTaskModal.value = {
    open: true,
    isEdit: false,
    editId: null,
    form: {
      category: '修心',
      title: '',
      description: '',
      icon: '🌿',
      points_reward: 1,
      dew_reward: 1,
      source_type: '自主打卡回報',
      habit_key: 'CUSTOM',
      sort_order: habitTasks.value.length + 1,
      completed_status_text: '今日已達成',
      pending_status_text: '尚未完成',
      is_active: true
    }
  };
}

function openEditHabitTaskModal(task) {
  habitTaskModal.value = {
    open: true,
    isEdit: true,
    editId: task.id,
    form: {
      category: task.category || '修養',
      title: task.title || '',
      description: task.description || '',
      icon: task.icon || '🌿',
      points_reward: task.points_reward ?? 1,
      dew_reward: task.dew_reward ?? 1,
      source_type: task.source_type || '自主打卡回報',
      habit_key: task.habit_key || 'CUSTOM',
      sort_order: task.sort_order ?? 1,
      completed_status_text: task.completed_status_text || '今日已達成',
      pending_status_text: task.pending_status_text || '尚未完成',
      is_active: task.is_active !== false
    }
  };
}

async function submitHabitTaskModal() {
  const f = habitTaskModal.value.form;
  const url = habitTaskModal.value.isEdit
    ? `/api/v1/admin/habit-tasks/${habitTaskModal.value.editId}`
    : '/api/v1/admin/habit-tasks';
  const method = habitTaskModal.value.isEdit ? 'PATCH' : 'POST';
  const res = await apiFetch(url, { method, body: JSON.stringify(f) });
  const result = await res.json();
  if (result.code === 200 || result.code === 201) {
    habitTaskModal.value.open = false;
    showToast(result.message);
    await loadAllAdminData();
    emit('data-updated');
  } else {
    alert(result.message);
  }
}

async function toggleHabitTaskActive(task) {
  const nextState = task.is_active === false;
  const res = await apiFetch(`/api/v1/admin/habit-tasks/${task.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: nextState })
  });
  const result = await res.json();
  if (result.code === 200) {
    showToast(`修養任務「${task.title}」已${nextState ? '啟用' : '停用'}`);
    await loadAllAdminData();
    emit('data-updated');
  }
}

async function deleteHabitTask(task) {
  if (!confirm(`確定要刪除日常修養任務「${task.category}・${task.title}」嗎？`)) return;
  const res = await apiFetch(`/api/v1/admin/habit-tasks/${task.id}`, { method: 'DELETE' });
  const result = await res.json();
  if (result.code === 200) {
    showToast(result.message);
    await loadAllAdminData();
    emit('data-updated');
  }
}

// Redemption actions
async function updateRedemptionStatus(r, status) {
  const label = status === 'USED' ? '核銷此福利券' : '作廢此福利券並退還點數';
  if (!confirm(`確定要${label} (${r.qr_voucher_code}) 嗎？`)) return;
  const res = await apiFetch(`/api/v1/admin/redemptions/${r.id}/status`, {
    method: 'POST',
    body: JSON.stringify({ status })
  });
  const result = await res.json();
  if (result.code === 200) {
    showToast(result.message);
    await loadAllAdminData();
    emit('data-updated');
  } else {
    alert(result.message);
  }
}

async function handleResetDemo() {
  if (!confirm('確定要將全系統重設為初始演示資料嗎？此動作將清除手動新增之會員與商品。')) return;
  const res = await apiFetch('/api/v1/admin/reset', { method: 'POST' });
  const result = await res.json();
  if (result.code === 200) {
    showToast(result.message);
    await loadAllAdminData();
    emit('data-updated');
  }
}

function downloadCharityCsv() {
  const records = charityReport.value.records || [];
  if (records.length === 0) {
    alert('尚無公益捐贈資料可導出');
    return;
  }
  let csv = '核銷序號,同仁姓名,員工工號,所屬部門,捐贈點數,竹山秀傳配對代捐金額(NTD),捐贈日期\n';
  records.forEach(r => {
    csv += `"${r.qr_voucher_code}","${r.employee_name}","${r.employee_no}","${r.dept_name}",${r.deducted_points},${r.actual_cash_value},"${r.created_at}"\n`;
  });
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `CSH_Qianshan_Donation_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Formatting helpers
function categoryLabel(cat) {
  const map = { MEAL: '日嚐餐飲', SPORTS: '運動用品', LOCAL: '在地物產', WELLNESS: '身心舒壓' };
  return map[cat] || cat;
}

function redemptionFilterLabel(f) {
  const map = { ALL: '全部', ACTIVE: '待使用', USED: '已核銷', DONATED: '已愛心轉捐', REVOKED: '已作廢' };
  return map[f] || f;
}

function statusLabel(s) {
  const map = { ACTIVE: '可使用', USED: '已核銷', DONATED: '已捐贈', REVOKED: '已作廢退點' };
  return map[s] || s;
}

function statusBadgeClass(s) {
  if (s === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (s === 'DONATED') return 'bg-red-50 text-nadeshiko border border-nadeshiko/30';
  if (s === 'REVOKED') return 'bg-gray-100 text-gray-500 border border-gray-200';
  return 'bg-shiraki text-chausu border border-shiraki-dark';
}

function formatTxType(type) {
  const map = {
    INITIAL_GRANT: '初始開立',
    EARN_VEGETARIAN: '蔬食入點',
    EARN_SPORT: '運動達標',
    EARN_CHECKUP: '健檢癌篩',
    REDEEM_COUPON: '好物兌換',
    CHARITY_DONATE: '公益捐贈',
    ADMIN_ADJUST: '管理員調整',
    VOUCHER_REFUND: '票券退點'
  };
  return map[type] || type;
}

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`;
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

