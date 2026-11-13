<template>
  <div class="min-h-screen washi-pattern text-sumikuro flex justify-center antialiased">
    <main class="w-full max-w-md bg-washi min-h-screen flex flex-col justify-between px-6 py-8 shadow-2xl border-x border-shiraki-dark/50">
      <!-- Top Brand & Zen Greeting -->
      <div class="pt-4 text-center space-y-3">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-wakatake-50 border border-wakatake-200 shadow-zen-card mx-auto">
          <svg viewBox="0 0 48 48" class="w-9 h-9" fill="none" stroke="#4A7C59" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M24 38V14" />
            <path d="M24 26c-5-1-9-5-10-10 5 0 9 3 10 10Z" fill="#4A7C59" fill-opacity="0.14" />
            <path d="M24 20c5-1 9-5 10-10-5 0-9 3-10 10Z" fill="#4A7C59" fill-opacity="0.14" />
            <path d="M15 38h18" />
          </svg>
        </div>

        <div>
          <p class="text-[11px] tracking-[0.28em] text-chausu font-serif">
            竹 山 秀 傳 醫 院
          </p>
          <h1 class="font-serif text-2xl font-bold tracking-wider text-sumikuro mt-1">
            健康銀行
          </h1>
          <p class="text-xs text-chausu font-serif mt-2 leading-relaxed">
            「在繁忙的白色長廊間，留一片沉靜的綠意。」
          </p>
        </div>
      </div>

      <!-- Login Card -->
      <div class="my-6 bg-white rounded-zen border border-shiraki-dark shadow-zen p-6 space-y-5">
        <div class="flex items-center justify-between border-b border-shiraki-dark pb-3">
          <span class="font-serif text-sm font-semibold text-sumikuro">
            ・同仁身份驗證
          </span>
          <span class="text-[10px] font-serif px-2 py-0.5 rounded-full bg-shiraki text-chausu border border-shiraki-dark">
            院內 AD 驗證
          </span>
        </div>

        <form @submit.prevent="handleCredentialLogin" class="space-y-4">
          <!-- Employee Number -->
          <div class="space-y-1.5">
            <label for="employee-no" class="block text-xs font-serif text-sumikuro">
              員工工號
            </label>
            <input
              id="employee-no"
              v-model.trim="employeeNo"
              type="text"
              autocomplete="username"
              placeholder="請輸入工號（例：E2108）"
              class="w-full h-11 px-3.5 rounded-xl bg-washi border border-shiraki-dark text-sm text-sumikuro placeholder:text-chausu/70 focus:outline-none focus:border-wakatake focus:ring-2 focus:ring-wakatake/15 transition-all font-mono uppercase"
            />
          </div>

          <!-- Password -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label for="login-password" class="block text-xs font-serif text-sumikuro">
                登入密碼
              </label>
              <span class="text-[11px] text-chausu">預設體驗密碼：csh1234</span>
            </div>
            <div class="relative">
              <input
                id="login-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="請輸入密碼"
                class="w-full h-11 pl-3.5 pr-12 rounded-xl bg-washi border border-shiraki-dark text-sm text-sumikuro placeholder:text-chausu/70 focus:outline-none focus:border-wakatake focus:ring-2 focus:ring-wakatake/15 transition-all"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-chausu hover:text-sumikuro font-serif"
              >
                {{ showPassword ? '隱藏' : '顯示' }}
              </button>
            </div>
          </div>

          <!-- Error Alert -->
          <div
            v-if="errorMessage"
            class="p-2.5 rounded-xl bg-nadeshiko/10 border border-nadeshiko/30 text-nadeshiko text-xs font-serif"
          >
            {{ errorMessage }}
          </div>

          <!-- Primary Login Button (Wakatake #4A7C59, 48px, pill) -->
          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full h-12 rounded-pill bg-wakatake hover:bg-wakatake-dark disabled:opacity-50 text-white font-serif text-sm tracking-wider transition-all active:scale-[0.99]"
          >
            {{ isSubmitting ? '正在進入庭園...' : '進入健康庭園' }}
          </button>
        </form>

        <!-- Quick Demo Account Switcher -->
        <div v-if="demoAccounts.length > 0" class="pt-2 border-t border-shiraki-dark/70 space-y-2">
          <p class="text-[11px] text-chausu font-serif">
            快速代入測試帳號（點選即填入工號與密碼）：
          </p>
          <div class="grid grid-cols-1 gap-2">
            <button
              v-for="acc in demoAccounts"
              :key="acc.employee_no"
              type="button"
              @click="selectDemoAccount(acc)"
              class="w-full px-3 py-2 rounded-xl text-left transition-all flex items-center justify-between border"
              :class="
                employeeNo.toUpperCase() === acc.employee_no
                  ? 'bg-wakatake-50 border-wakatake text-sumikuro'
                  : 'bg-shiraki hover:bg-shiraki-dark/70 border-shiraki-dark text-sumikuro'
              "
            >
              <div>
                <div class="text-xs font-serif font-semibold">
                  {{ acc.name }}
                  <span class="font-mono text-[11px] text-wakatake ml-1">{{ acc.employee_no }}</span>
                </div>
                <div class="text-[10px] text-chausu">
                  {{ acc.dept_code }}
                </div>
              </div>
              <span
                class="text-[10px] px-2 py-0.5 rounded-full font-serif border"
                :class="
                  acc.role === 'ADMIN'
                    ? 'bg-kohaku/15 text-kohaku-dark border-kohaku/30'
                    : 'bg-white text-chausu border-shiraki-dark'
                "
              >
                {{ acc.role === 'ADMIN' ? '系統管理員 (ADMIN)' : '一般同仁 (STAFF)' }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="text-center space-y-1 pb-2">
        <p class="text-[11px] text-chausu font-serif">
          以心餵養・雙重記帳安全守護
        </p>
        <p class="text-[10px] text-chausu/80">
          竹山秀傳醫院 CSH-HealthBank v1.0.0
        </p>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { apiFetch, setAuthToken } from '../utils/api.js';

const emit = defineEmits(['login-success']);

const employeeNo = ref('E2108');
const password = ref('csh1234');
const showPassword = ref(false);
const errorMessage = ref('');
const isSubmitting = ref(false);
const demoAccounts = ref([]);

onMounted(async () => {
  try {
    const res = await apiFetch('/api/v1/auth/demo-accounts');
    const result = await res.json();
    if (result.code === 200) {
      demoAccounts.value = result.data || [];
    }
  } catch (err) {
    console.error('Failed to fetch demo accounts:', err);
  }
});

function selectDemoAccount(acc) {
  employeeNo.value = acc.employee_no;
  password.value = 'csh1234';
  errorMessage.value = '';
}

async function handleCredentialLogin() {
  errorMessage.value = '';
  if (!employeeNo.value || !password.value) {
    errorMessage.value = '請輸入員工工號與登入密碼';
    return;
  }

  isSubmitting.value = true;
  try {
    const res = await apiFetch('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        employee_no: employeeNo.value,
        password: password.value
      })
    });
    const result = await res.json();
    if (result.code === 200 && result.data?.token) {
      setAuthToken(result.data.token);
      emit('login-success', result.data.user);
    } else {
      errorMessage.value = result.message || '登入失敗，請確認工號與密碼';
    }
  } catch (err) {
    errorMessage.value = '連線失敗，請確認伺服器狀態';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

