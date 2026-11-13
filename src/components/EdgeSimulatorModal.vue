<template>
  <transition name="drawer-slide">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex justify-end bg-sumikuro/40 backdrop-blur-[2px]"
      @click.self="close"
    >
      <div class="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden text-sumikuro">
        <!-- Header -->
        <div class="p-4 bg-sumikuro text-white flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-base">🛠️</span>
            <div>
              <h3 class="font-serif text-sm font-bold tracking-wide">院內實體系統介接中台模擬器</h3>
              <p class="text-[10px] text-gray-300">Hospital Edge Hardware & HIS Simulator</p>
            </div>
          </div>
          <button @click="close" class="text-gray-400 hover:text-white text-lg p-1">✕</button>
        </div>

        <!-- Scrollable content -->
        <div class="flex-1 overflow-y-auto p-4 space-y-5 bg-washi">
          <!-- 1. POS Restaurant Card Swipe -->
          <div class="bg-white p-4 rounded-xl border border-shiraki-dark shadow-zen">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-serif font-bold text-wakatake flex items-center gap-1.5">
                <span>🥗</span> 1. 員工餐廳 POS 機蔬食刷卡
              </span>
              <span class="text-[10px] text-chausu font-mono">/api/v1/integrations/pos-event</span>
            </div>
            <p class="text-xs text-chausu leading-relaxed mb-3">
              週一、二蔬食日，同仁於餐檯感應員工 RFID 識別證。POS Webhook 自動帶入流水單號與防重入 Hash。
            </p>
            <div class="space-y-2 mb-3">
              <div class="flex items-center justify-between text-xs bg-shiraki-light px-2.5 py-1.5 rounded border border-shiraki-dark">
                <span class="text-chausu">感應證號：</span>
                <span class="font-mono font-semibold">{{ currentEmployee.card_uid }} ({{ currentEmployee.name }})</span>
              </div>
              <div class="flex items-center justify-between text-xs bg-shiraki-light px-2.5 py-1.5 rounded border border-shiraki-dark">
                <span class="text-chausu">入帳回饋：</span>
                <span class="text-wakatake font-semibold">+1 點 (健康點數) ＆ +1 滴晨露</span>
              </div>
            </div>
            <button
              @click="triggerPosEvent"
              :disabled="loadingPos"
              class="w-full py-2 bg-wakatake hover:bg-wakatake-dark text-white text-xs font-serif rounded-pill shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <span>💳</span>
              <span>{{ loadingPos ? '感應訊號發送中...' : '模擬同仁感應 RFID 刷卡 (POS Webhook)' }}</span>
            </button>
          </div>

          <!-- 2. Gym Access Control Swipe -->
          <div class="bg-white p-4 rounded-xl border border-shiraki-dark shadow-zen">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-serif font-bold text-[#3B82F6] flex items-center gap-1.5">
                <span>🏃</span> 2. 體能教室感應門禁 (運動 30 分鐘)
              </span>
              <span class="text-[10px] text-chausu font-mono">/api/v1/integrations/gym-access</span>
            </div>
            <p class="text-xs text-chausu leading-relaxed mb-3">
              刷卡進場時須掃描體能教室門禁 QR Code 記錄進場時間，運動滿 30 分鐘後刷退。差值 &ge; 30 分鐘自動觸發點數入帳。
            </p>

            <!-- Gym Status Pill -->
            <div class="mb-3 p-2.5 rounded bg-blue-50 border border-blue-200 text-xs space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-gray-600">目前運動狀態：</span>
                <span v-if="activeGymSession" class="font-semibold text-blue-700 flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                  正在運動中 ({{ formatTime(activeGymSession.start_time) }} {{ activeGymSession.entry_method === 'QR_SCAN' ? '掃碼進場' : '進場' }})
                </span>
                <span v-else class="text-chausu">未進場</span>
              </div>
              <div v-if="activeGymSession?.sport_name" class="flex items-center justify-between text-[11px] text-blue-800">
                <span class="text-gray-600">進行項目：</span>
                <span class="font-serif font-semibold">{{ activeGymSession.sport_name }} (需滿 {{ activeGymSession.min_duration_mins || 30 }} 分)</span>
              </div>
            </div>

            <!-- Sport Item Selector -->
            <div v-if="!activeGymSession && sportItems.length > 0" class="mb-3">
              <label class="block text-[11px] text-chausu font-serif mb-1">選擇體能運動項目</label>
              <select
                v-model="selectedSportId"
                @change="gymQrStepOpen && openGymQrEntry()"
                class="w-full h-9 px-2.5 rounded-lg bg-shiraki-light border border-shiraki-dark text-xs font-serif text-sumikuro"
              >
                <option v-for="s in sportItems" :key="s.id" :value="s.id">
                  {{ s.icon || '🏃' }} {{ s.name }}（{{ s.min_duration_mins }}分・+{{ s.reward_points }}pt・{{ s.usage_mode === 'SINGLE' ? (s.active_users_count > 0 ? `限1人｜${s.occupied_by?.[0]?.user_name || '使用中'}` : '限1人') : `可多人｜${s.active_users_count || 0}人使用中` }}・{{ (s.daily_limit ?? 1) === 0 ? '不限次數' : `今日${s.user_today_usage || 0}/${s.daily_limit ?? 1}次` }}）
                </option>
              </select>
            </div>

            <!-- QR Code Entry Scanner Step -->
            <div
              v-if="gymQrStepOpen && !activeGymSession"
              class="mb-3 p-3.5 rounded-xl bg-shiraki-light border border-blue-200 space-y-3"
            >
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-serif font-bold text-blue-700 flex items-center gap-1.5">
                  <span>📱</span> 刷卡感應完成・請掃描門禁 QR Code 進場
                </span>
                <button
                  @click="openGymQrEntry"
                  :disabled="loadingGym"
                  class="text-[11px] text-blue-600 hover:underline font-serif"
                >
                  🔄 重新產製 QR
                </button>
              </div>

              <!-- QR Display & Camera Scanner -->
              <div class="flex flex-col items-center bg-white p-3 rounded-xl border border-dashed border-blue-300 relative overflow-hidden">
                <div v-if="cameraActive" class="w-full max-w-[200px] aspect-square bg-black rounded-lg overflow-hidden relative">
                  <video ref="videoEl" autoplay playsinline muted class="w-full h-full object-cover"></video>
                  <div class="scan-laser"></div>
                </div>
                <div v-else class="relative p-1.5 bg-white rounded-lg">
                  <img v-if="gymQrImageUrl" :src="gymQrImageUrl" alt="Gym Entry QR Code" class="w-36 h-36 object-contain" />
                  <div v-else class="w-36 h-36 flex items-center justify-center text-xs text-chausu">
                    正在產生門禁 QR...
                  </div>
                  <div v-if="gymQrImageUrl" class="scan-laser"></div>
                </div>

                <div class="mt-2 text-center">
                  <div class="font-mono text-[10px] font-bold text-sumikuro bg-shiraki-light px-2 py-0.5 rounded border border-shiraki-dark">
                    {{ gymQrData?.qr_code }}
                  </div>
                  <p class="text-[10px] text-chausu mt-1">
                    項目：{{ gymQrData?.sport_name || '體能教室運動' }} ({{ gymQrData?.usage_mode === 'SINGLE' ? '同時間限 1 人' : '可同時多人' }}・{{ (gymQrData?.daily_limit ?? 1) === 0 ? '當日不限次' : `當日限 ${gymQrData?.daily_limit ?? 1} 次` }})・場域：{{ gymQrData?.gate_id || 'GYM-GATE-01' }}
                  </p>
                  <p class="text-[10px] text-chausu">
                    感應證號：{{ currentEmployee.card_uid }}
                  </p>
                </div>
              </div>

              <!-- Camera message -->
              <p v-if="cameraMessage" class="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                {{ cameraMessage }}
              </p>

              <!-- QR Code Input (for barcode gun / manual / verified token) -->
              <div>
                <label class="block text-[11px] text-chausu font-serif mb-1">門禁掃碼結果 / 條碼序號</label>
                <input
                  v-model.trim="scannedQrCode"
                  type="text"
                  placeholder="CSH-GYM-QR-..."
                  class="w-full h-8 px-2.5 rounded-lg bg-white border border-shiraki-dark font-mono text-xs text-sumikuro"
                />
              </div>

              <p v-if="gymQrError" class="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                {{ gymQrError }}
              </p>

              <div class="flex flex-wrap gap-2">
                <button
                  @click="confirmGymQrEntry"
                  :disabled="loadingGym || !scannedQrCode"
                  class="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-serif rounded-pill shadow-sm transition-all"
                >
                  {{ loadingGym ? 'QR 驗證進場中...' : '📲 掃描 QR Code 確認進場' }}
                </button>
                <button
                  type="button"
                  @click="toggleCameraScan"
                  class="py-2 px-3 bg-white hover:bg-shiraki border border-shiraki-dark text-sumikuro text-xs font-serif rounded-pill transition-all"
                >
                  {{ cameraActive ? '關閉鏡頭' : '📷 相機掃碼' }}
                </button>
                <button
                  type="button"
                  @click="cancelGymQrStep"
                  class="py-2 px-3 bg-white hover:bg-shiraki border border-shiraki-dark text-chausu text-xs font-serif rounded-pill transition-all"
                >
                  取消
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button
                @click="openGymQrEntry"
                :disabled="loadingGym || !!activeGymSession"
                class="py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-serif rounded-pill shadow-sm transition-all"
              >
                ① 刷卡掃碼進場 (計時開始)
              </button>
              <button
                @click="triggerGymExit"
                :disabled="loadingGym || !activeGymSession"
                class="py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-serif rounded-pill shadow-sm transition-all"
              >
                ② 滿 30 分鐘刷退 (+1 pt)
              </button>
            </div>
          </div>

          <!-- 3. HIS Cancer Screen & Checkup Batch ETL -->
          <div class="bg-white p-4 rounded-xl border border-shiraki-dark shadow-zen">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-serif font-bold text-nadeshiko flex items-center gap-1.5">
                <span>🩺</span> 3. 檢驗科 HIS 凌晨 02:00 ETL 排程
              </span>
              <span class="text-[10px] text-chausu font-mono">/api/v1/integrations/his-sync</span>
            </div>
            <p class="text-xs text-chausu leading-relaxed mb-3">
              每日凌晨自動排程對接院內 HIS 副本庫，查核昨日四癌篩檢（子宮頸抹片、乳房攝影、大腸便潛血、口腔）與年度健檢完成名單。
            </p>
            <button
              @click="triggerHisSync"
              :disabled="loadingHis"
              class="w-full py-2 bg-nadeshiko hover:bg-nadeshiko-dark text-white text-xs font-serif rounded-pill shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <span>⚙️</span>
              <span>{{ loadingHis ? 'ETL 資料同步中...' : '手動觸發 HIS 健檢與癌篩 ETL 同步 (+2 pt)' }}</span>
            </button>
          </div>

          <!-- 4. Live Edge Webhook Raw Logs -->
          <div class="bg-white p-4 rounded-xl border border-shiraki-dark shadow-zen">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-serif font-bold text-sumikuro flex items-center gap-1.5">
                <span>📜</span> 實體中台日誌流 (Edge Logs)
              </span>
              <button @click="fetchLogs" class="text-[11px] text-wakatake hover:underline">
                重新整理
              </button>
            </div>
            <div class="bg-gray-900 text-gray-200 font-mono text-[11px] p-3 rounded-lg max-h-48 overflow-y-auto space-y-2">
              <div v-if="logs.length === 0" class="text-gray-500 text-center py-4">
                尚無事件記錄
              </div>
              <div
                v-for="log in logs"
                :key="log.id"
                class="border-b border-gray-800 pb-1.5 last:border-0 last:pb-0"
              >
                <div class="flex items-center justify-between text-gray-400 text-[10px]">
                  <span>[{{ log.source }}]</span>
                  <span>{{ formatTime(log.created_at) }}</span>
                </div>
                <div class="text-emerald-400 mt-0.5">{{ log.message }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import QRCode from 'qrcode';
import { apiFetch } from '../utils/api.js';

const props = defineProps({
  isOpen: Boolean,
  currentEmployee: {
    type: Object,
    default: () => ({
      name: '陳小嵐',
      employee_no: 'E2108',
      card_uid: 'CARD-CSH-8821'
    })
  },
  activeGymSession: Object
});

const emit = defineEmits(['close', 'hardware-triggered']);

const loadingPos = ref(false);
const loadingGym = ref(false);
const loadingHis = ref(false);
const logs = ref([]);
const sportItems = ref([]);
const selectedSportId = ref('');

const gymQrStepOpen = ref(false);
const gymQrData = ref(null);
const gymQrImageUrl = ref('');
const scannedQrCode = ref('');
const gymQrError = ref('');
const cameraActive = ref(false);
const cameraMessage = ref('');
const videoEl = ref(null);
let mediaStream = null;
let scanInterval = null;

onMounted(() => {
  fetchLogs();
  fetchSports();
});

onUnmounted(() => {
  stopCamera();
});

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      fetchLogs();
      fetchSports();
    } else {
      stopCamera();
    }
  }
);

async function fetchSports() {
  try {
    const res = await apiFetch('/api/v1/integrations/sports');
    const result = await res.json();
    if (result.code === 200) {
      sportItems.value = result.data || [];
      if (sportItems.value.length > 0 && !sportItems.value.some(s => s.id === selectedSportId.value)) {
        selectedSportId.value = sportItems.value[0].id;
      }
    }
  } catch (err) {
    console.error('Failed to fetch sport items:', err);
  }
}

async function fetchLogs() {
  try {
    const res = await apiFetch('/api/v1/integrations/logs');
    const result = await res.json();
    if (result.code === 200) {
      logs.value = result.data || [];
    }
  } catch (err) {
    console.error('Failed to fetch hardware logs:', err);
  }
}

async function triggerPosEvent() {
  loadingPos.value = true;
  try {
    const res = await apiFetch('/api/v1/integrations/pos-event', {
      method: 'POST',
      body: JSON.stringify({
        terminal_id: 'POS-CANTEEN-02',
        receipt_no: `REC-${Date.now().toString().slice(-6)}`,
        card_uid: props.currentEmployee.card_uid,
        date: new Date().toISOString().slice(0, 10),
        meal_name: '週二和風彩蔬定食'
      })
    });
    const result = await res.json();
    await Promise.all([fetchLogs(), fetchSports()]);
    emit('hardware-triggered', result);
  } catch (err) {
    alert('POS Webhook 失敗: ' + err.message);
  } finally {
    loadingPos.value = false;
  }
}

async function openGymQrEntry() {
  loadingGym.value = true;
  gymQrError.value = '';
  cameraMessage.value = '';
  try {
    const res = await apiFetch('/api/v1/integrations/gym-entry-qr', {
      method: 'POST',
      body: JSON.stringify({
        card_uid: props.currentEmployee.card_uid,
        sport_id: selectedSportId.value || null
      })
    });
    const result = await res.json();
    if (result.code !== 200 || !result.data?.qr_code) {
      throw new Error(result.message || '無法產製進場 QR Code');
    }

    gymQrData.value = result.data;
    scannedQrCode.value = result.data.qr_code;
    gymQrImageUrl.value = await QRCode.toDataURL(result.data.qr_code, {
      width: 180,
      margin: 1,
      color: {
        dark: '#2B2D2F',
        light: '#FFFFFF'
      }
    });
    gymQrStepOpen.value = true;
  } catch (err) {
    alert('產製門禁 QR Code 失敗: ' + err.message);
  } finally {
    loadingGym.value = false;
  }
}

async function confirmGymQrEntry() {
  if (!scannedQrCode.value) {
    gymQrError.value = '請先掃描或輸入門禁 QR Code 序號';
    return;
  }
  loadingGym.value = true;
  gymQrError.value = '';
  try {
    const res = await apiFetch('/api/v1/integrations/gym-access', {
      method: 'POST',
      body: JSON.stringify({
        action: 'ENTRY',
        card_uid: props.currentEmployee.card_uid,
        entry_method: 'QR_SCAN',
        qr_code: scannedQrCode.value,
        sport_id: selectedSportId.value || null
      })
    });
    const result = await res.json();
    await Promise.all([fetchLogs(), fetchSports()]);
    if (result.code === 200) {
      cancelGymQrStep();
      emit('hardware-triggered', result);
    } else {
      gymQrError.value = result.message || 'QR Code 驗證失敗';
    }
  } catch (err) {
    gymQrError.value = '門禁掃碼進場失敗: ' + err.message;
  } finally {
    loadingGym.value = false;
  }
}

async function toggleCameraScan() {
  if (cameraActive.value) {
    stopCamera();
    return;
  }

  cameraMessage.value = '';
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    cameraMessage.value = '目前環境不支援瀏覽器相機擷取，請使用「掃描 QR Code 確認進場」完成模擬。';
    return;
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    cameraActive.value = true;
    await nextTick();
    if (videoEl.value) {
      videoEl.value.srcObject = mediaStream;
      await videoEl.value.play();
    }

    if ('BarcodeDetector' in window) {
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      scanInterval = setInterval(async () => {
        if (!videoEl.value || videoEl.value.readyState < 2) return;
        try {
          const codes = await detector.detect(videoEl.value);
          if (codes.length > 0 && codes[0].rawValue) {
            scannedQrCode.value = codes[0].rawValue;
            stopCamera();
            await confirmGymQrEntry();
          }
        } catch {
          // Ignore transient frame detection errors
        }
      }, 400);
    } else {
      cameraMessage.value = '鏡頭已啟動，但此瀏覽器不支援自動 QR 辨識，請確認序號後點擊進場。';
    }
  } catch {
    stopCamera();
    cameraMessage.value = '無法開啟相機鏡頭（無攝影機或權限未開啟），請直接點擊「掃描 QR Code 確認進場」。';
  }
}

function stopCamera() {
  if (scanInterval) {
    clearInterval(scanInterval);
    scanInterval = null;
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }
  cameraActive.value = false;
}

function cancelGymQrStep() {
  stopCamera();
  gymQrStepOpen.value = false;
  gymQrError.value = '';
  cameraMessage.value = '';
}

async function triggerGymExit() {
  loadingGym.value = true;
  try {
    const res = await apiFetch('/api/v1/integrations/gym-access', {
      method: 'POST',
      body: JSON.stringify({
        action: 'EXIT',
        card_uid: props.currentEmployee.card_uid,
        force_duration_mins: 35 // simulate reaching >= 30 mins
      })
    });
    const result = await res.json();
    await Promise.all([fetchLogs(), fetchSports()]);
    emit('hardware-triggered', result);
  } catch (err) {
    alert('門禁刷退感應失敗: ' + err.message);
  } finally {
    loadingGym.value = false;
  }
}

async function triggerHisSync() {
  loadingHis.value = true;
  try {
    const res = await apiFetch('/api/v1/integrations/his-sync', {
      method: 'POST',
      body: JSON.stringify({
        batch_date: new Date().toISOString().slice(0, 10),
        sync_type: 'ALL'
      })
    });
    const result = await res.json();
    await Promise.all([fetchLogs(), fetchSports()]);
    emit('hardware-triggered', result);
  } catch (err) {
    alert('HIS ETL 失敗: ' + err.message);
  } finally {
    loadingHis.value = false;
  }
}

function formatTime(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
}

function close() {
  stopCamera();
  emit('close');
}
</script>

<style scoped>
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
.scan-laser {
  position: absolute;
  left: 6px;
  right: 6px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #2563eb, transparent);
  box-shadow: 0 0 8px rgba(37, 99, 235, 0.8);
  animation: qr-scan-sweep 2s ease-in-out infinite;
  pointer-events: none;
}
@keyframes qr-scan-sweep {
  0%,
  100% {
    top: 10%;
  }
  50% {
    top: 88%;
  }
}
</style>

