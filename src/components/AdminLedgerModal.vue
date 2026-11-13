<template>
  <transition name="modal-fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sumikuro/50 backdrop-blur-sm"
      @click.self="close"
    >
      <div class="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-shiraki-dark flex flex-col max-h-[85vh] overflow-hidden text-sumikuro">
        <!-- Header -->
        <div class="p-4 bg-sumikuro text-white flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-lg">📊</span>
            <div>
              <h3 class="font-serif text-sm font-bold tracking-wider">職安衛・人資與財務審計後台</h3>
              <p class="text-[10px] text-gray-300">CSH HealthBank Audit & Double-Entry Ledger</p>
            </div>
          </div>
          <button @click="close" class="text-gray-400 hover:text-white text-lg p-1">✕</button>
        </div>

        <!-- Navigation Sub-tabs -->
        <div class="flex border-b border-shiraki-dark bg-shiraki-light px-4 pt-2 gap-4 text-xs font-serif">
          <button
            @click="activeSubTab = 'ledger'"
            class="pb-2 font-bold transition-colors border-b-2"
            :class="activeSubTab === 'ledger' ? 'border-wakatake text-wakatake' : 'border-transparent text-chausu hover:text-sumikuro'"
          >
            雙重記帳點數帳本 (point_ledger)
          </button>
          <button
            @click="activeSubTab = 'charity'"
            class="pb-2 font-bold transition-colors border-b-2"
            :class="activeSubTab === 'charity' ? 'border-nadeshiko text-nadeshiko' : 'border-transparent text-chausu hover:text-sumikuro'"
          >
            前山基金會公益代捐清冊 (Phase 4 財務對帳)
          </button>
        </div>

        <!-- Content Body -->
        <div class="flex-1 overflow-y-auto p-4 bg-washi">
          <!-- 1. Double-Entry Ledger View -->
          <div v-if="activeSubTab === 'ledger'" class="space-y-3">
            <div class="flex items-center justify-between text-xs">
              <span class="text-chausu">
                每筆紀錄皆具備唯一冪等性鍵（Idempotency Key），防範並發超扣與雙花。
              </span>
              <span class="font-bold text-wakatake">
                帳本紀錄共 {{ ledger.length }} 筆
              </span>
            </div>

            <div class="bg-white rounded-xl border border-shiraki-dark overflow-hidden shadow-sm">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs font-serif">
                  <thead class="bg-shiraki text-chausu text-[11px] border-b border-shiraki-dark">
                    <tr>
                      <th class="p-2.5">序號</th>
                      <th class="p-2.5">交易類型</th>
                      <th class="p-2.5">變動點數</th>
                      <th class="p-2.5">餘額快照</th>
                      <th class="p-2.5">說明 / 關聯單號</th>
                      <th class="p-2.5">時間</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-shiraki-dark/60 font-sans text-[11px]">
                    <tr v-for="entry in ledger" :key="entry.id" class="hover:bg-shiraki-light/50">
                      <td class="p-2.5 font-mono text-chausu">#{{ entry.id }}</td>
                      <td class="p-2.5">
                        <span
                          class="px-2 py-0.5 rounded text-[10px] font-semibold"
                          :class="entry.points > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'"
                        >
                          {{ formatTxType(entry.transaction_type) }}
                        </span>
                      </td>
                      <td class="p-2.5 font-bold font-mono" :class="entry.points > 0 ? 'text-wakatake' : 'text-nadeshiko'">
                        {{ entry.points > 0 ? '+' + entry.points : entry.points }} pt
                      </td>
                      <td class="p-2.5 font-mono font-semibold text-sumikuro">
                        {{ entry.balance_snapshot }} pt
                      </td>
                      <td class="p-2.5 text-chausu max-w-xs truncate" :title="entry.notes">
                        {{ entry.notes }}
                        <span v-if="entry.source_ref_id" class="block font-mono text-[10px] text-gray-400">
                          單號: {{ entry.source_ref_id }}
                        </span>
                      </td>
                      <td class="p-2.5 text-chausu font-mono text-[10px]">
                        {{ formatTime(entry.created_at) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- 2. Qianshan Foundation Report View -->
          <div v-else-if="activeSubTab === 'charity'" class="space-y-4">
            <!-- Summary Stats -->
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-white p-3.5 rounded-xl border border-shiraki-dark shadow-sm">
                <div class="text-[11px] text-chausu font-serif">同仁愛心轉化總點數</div>
                <div class="text-xl font-bold font-number text-nadeshiko mt-1">
                  {{ charityReport.summary?.total_donated_points || 0 }} <span class="text-xs">pt</span>
                </div>
              </div>
              <div class="bg-white p-3.5 rounded-xl border border-shiraki-dark shadow-sm">
                <div class="text-[11px] text-chausu font-serif">竹山秀傳配對代捐金</div>
                <div class="text-xl font-bold font-number text-wakatake mt-1">
                  NT$ {{ charityReport.summary?.total_matching_funds_ntd || 0 }}
                </div>
                <div class="text-[10px] text-chausu mt-0.5">100 點加倍代捐 200 元</div>
              </div>
              <div class="bg-white p-3.5 rounded-xl border border-shiraki-dark shadow-sm">
                <div class="text-[11px] text-chausu font-serif">累計受贈筆數</div>
                <div class="text-xl font-bold font-number text-sumikuro mt-1">
                  {{ charityReport.summary?.total_records || 0 }} <span class="text-xs">次</span>
                </div>
              </div>
            </div>

            <!-- Table of Donors -->
            <div class="bg-white rounded-xl border border-shiraki-dark overflow-hidden shadow-sm">
              <div class="p-3 bg-shiraki flex items-center justify-between border-b border-shiraki-dark text-xs font-serif font-bold">
                <span>受贈對象：財團法人南投縣私立前山社會福利慈善事業基金會</span>
                <button @click="downloadCsv" class="px-2.5 py-1 bg-white hover:bg-shiraki rounded border border-shiraki-dark text-xs flex items-center gap-1 font-sans">
                  <span>📥</span> 導出審計 CSV
                </button>
              </div>
              <table class="w-full text-left text-xs font-serif">
                <thead class="bg-shiraki-light text-chausu text-[10px]">
                  <tr>
                    <th class="p-2">核銷序號</th>
                    <th class="p-2">同仁姓名 / 工號</th>
                    <th class="p-2">所屬部門</th>
                    <th class="p-2">捐出點數</th>
                    <th class="p-2">醫院代捐金額</th>
                    <th class="p-2">完成日期</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-shiraki-dark/60 font-sans text-[11px]">
                  <tr v-if="!charityReport.records || charityReport.records.length === 0">
                    <td colspan="6" class="p-4 text-center text-chausu">尚無捐贈紀錄</td>
                  </tr>
                  <tr v-for="rec in charityReport.records" :key="rec.id">
                    <td class="p-2 font-mono text-[10px] text-chausu">{{ rec.qr_voucher_code }}</td>
                    <td class="p-2 font-bold">{{ rec.employee_name }} ({{ rec.employee_no }})</td>
                    <td class="p-2 text-chausu">{{ rec.dept_name }}</td>
                    <td class="p-2 font-mono text-nadeshiko font-bold">{{ rec.deducted_points }} pt</td>
                    <td class="p-2 font-mono text-wakatake font-bold">NT$ {{ rec.actual_cash_value }}</td>
                    <td class="p-2 font-mono text-[10px] text-chausu">{{ formatTime(rec.created_at) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="p-3 bg-shiraki-light border-t border-shiraki-dark flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2 flex-wrap">
            <button
              @click="handleSetPoints9999"
              class="px-3 py-1.5 rounded-pill text-xs font-serif bg-amber-100 hover:bg-amber-200 text-kohaku-dark font-semibold transition-colors flex items-center gap-1 border border-amber-300"
            >
              <span>💰</span> 點數充值至 9999 pt
            </button>
            <button
              @click="handleSetLv1And99Dew"
              class="px-3 py-1.5 rounded-pill text-xs font-serif bg-emerald-100 hover:bg-emerald-200 text-wakatake-dark font-semibold transition-colors flex items-center gap-1 border border-emerald-300"
            >
              <span>🌱</span> 回到 Lv.1 ＋ 給予 99 滴露水
            </button>
            <button
              @click="handleResetDemo"
              class="px-3 py-1.5 rounded-pill text-xs font-serif bg-red-100 hover:bg-red-200 text-red-700 transition-colors flex items-center gap-1"
            >
              <span>🔄</span> 重設演示資料
            </button>
          </div>
          <button
            @click="close"
            class="px-5 py-1.5 rounded-pill text-xs font-serif bg-sumikuro hover:bg-gray-800 text-white transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch } from 'vue';
import { apiFetch } from '../utils/api.js';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close', 'reset-data']);

const activeSubTab = ref('ledger');
const ledger = ref([]);
const charityReport = ref({});

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      loadLedger();
      loadCharityReport();
    }
  }
);

async function loadLedger() {
  try {
    const res = await apiFetch('/api/v1/admin/ledger');
    const result = await res.json();
    if (result.code === 200) {
      ledger.value = result.data || [];
    }
  } catch (err) {
    console.error('Error loading ledger:', err);
  }
}

async function loadCharityReport() {
  try {
    const res = await apiFetch('/api/v1/admin/charity-report');
    const result = await res.json();
    if (result.code === 200) {
      charityReport.value = result.data || {};
    }
  } catch (err) {
    console.error('Error loading charity report:', err);
  }
}

async function handleSetPoints9999() {
  try {
    const res = await apiFetch('/api/v1/admin/set-points', {
      method: 'POST',
      body: JSON.stringify({ target_points: 9999 })
    });
    const result = await res.json();
    if (result.code === 200) {
      alert(result.message);
      await loadLedger();
      emit('reset-data');
    } else {
      alert(result.message);
    }
  } catch (err) {
    alert('設定失敗: ' + err.message);
  }
}

async function handleSetLv1And99Dew() {
  try {
    const res = await apiFetch('/api/v1/admin/set-tree-state', {
      method: 'POST',
      body: JSON.stringify({ level: 1, exp: 0, dew: 99 })
    });
    const result = await res.json();
    if (result.code === 200) {
      alert(result.message);
      emit('reset-data');
      close();
    } else {
      alert(result.message);
    }
  } catch (err) {
    alert('設定失敗: ' + err.message);
  }
}

async function handleResetDemo() {
  if (!confirm('確定要將健康銀行系統重設為初始演示資料嗎？')) return;
  try {
    const res = await apiFetch('/api/v1/admin/reset', { method: 'POST' });
    const result = await res.json();
    if (result.code === 200) {
      alert(result.message);
      await loadLedger();
      await loadCharityReport();
      emit('reset-data');
    }
  } catch (err) {
    alert('重設失敗: ' + err.message);
  }
}

function downloadCsv() {
  const records = charityReport.value.records || [];
  if (records.length === 0) {
    alert('尚無資料可導出');
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

function formatTxType(type) {
  const map = {
    INITIAL_GRANT: '系統初始開立',
    EARN_VEGETARIAN: '蔬食刷卡入點',
    EARN_SPORT: '體能運動達標',
    EARN_CHECKUP: '健檢癌篩入帳',
    REDEEM_COUPON: '生活禮遇兌換',
    CHARITY_DONATE: '前山愛心轉化'
  };
  return map[type] || type;
}

function formatTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`;
}

function close() {
  emit('close');
}
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>

