<template>
  <transition name="modal-fade">
    <div
      v-if="isOpen && voucher"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sumikuro/50 backdrop-blur-sm"
      @click.self="close"
    >
      <div class="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-shiraki-dark text-sumikuro">
        <!-- Close button -->
        <button
          @click="close"
          class="absolute top-4 right-4 text-chausu hover:text-sumikuro text-lg w-7 h-7 flex items-center justify-center rounded-full hover:bg-shiraki"
        >
          ✕
        </button>

        <!-- Header -->
        <div class="text-center pb-3 border-b border-shiraki-dark">
          <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-serif bg-wakatake-50 text-wakatake font-semibold mb-1">
            竹山秀傳員工福利券
          </span>
          <h3 class="font-serif text-base font-bold text-sumikuro">
            {{ voucher.item_name }}
          </h3>
          <p class="text-xs text-chausu mt-0.5">
            折抵額度：NT$ {{ voucher.actual_cash_value }} 元
          </p>
        </div>

        <!-- Status & QR Code -->
        <div class="py-5 flex flex-col items-center">
          <div class="relative p-3 bg-white border-2 border-dashed border-shiraki-dark rounded-xl shadow-inner">
            <img v-if="qrDataUrl" :src="qrDataUrl" alt="Voucher QR Code" class="w-44 h-44 object-contain" />
            <div v-else class="w-44 h-44 flex items-center justify-center text-xs text-chausu">
              正在生成憑證條碼...
            </div>

            <!-- Overlay if USED -->
            <div
              v-if="voucher.status === 'USED'"
              class="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center"
            >
              <div class="hanko-stamp-round w-20 h-20 text-xs flex-col border-chausu text-chausu font-serif">
                <span>已核銷</span>
                <span>済</span>
              </div>
            </div>
          </div>

          <!-- Voucher Code Text -->
          <div class="mt-3 text-center">
            <span class="font-mono text-xs tracking-wider text-sumikuro font-bold bg-shiraki-light px-2 py-1 rounded border border-shiraki-dark">
              {{ voucher.qr_voucher_code }}
            </span>
            <p class="text-[11px] text-chausu mt-1.5 font-serif">
              請於結帳時向餐廳餐檯或福利窗口出示此 QR Code
            </p>
          </div>
        </div>

        <!-- Actions / Simulation Button -->
        <div class="space-y-2 pt-2 border-t border-shiraki-dark">
          <button
            v-if="voucher.status === 'ACTIVE'"
            @click="handleVerifyVoucher"
            :disabled="isVerifying"
            class="w-full py-2.5 rounded-pill font-serif text-xs bg-kohaku hover:bg-kohaku-dark text-white shadow-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <span>📱</span>
            <span>{{ isVerifying ? '核銷感應中...' : '模擬餐檯店員掃碼核銷' }}</span>
          </button>

          <div v-else class="text-center py-2 text-xs text-chausu font-serif">
            已於 {{ formatTime(voucher.used_at) }} 完成核銷
          </div>

          <button
            @click="close"
            class="w-full py-2 rounded-pill font-serif text-xs bg-shiraki hover:bg-shiraki-dark text-sumikuro border border-shiraki-dark transition-colors"
          >
            關閉視窗
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch } from 'vue';
import QRCode from 'qrcode';
import { apiFetch } from '../utils/api.js';

const props = defineProps({
  isOpen: Boolean,
  voucher: Object
});

const emit = defineEmits(['close', 'verified']);

const qrDataUrl = ref('');
const isVerifying = ref(false);

watch(
  () => props.voucher,
  async (newVoucher) => {
    if (newVoucher && newVoucher.qr_voucher_code) {
      try {
        qrDataUrl.value = await QRCode.toDataURL(newVoucher.qr_voucher_code, {
          width: 200,
          margin: 1,
          color: {
            dark: '#2B2D2F',
            light: '#FFFFFF'
          }
        });
      } catch (err) {
        console.error('Error generating QR Code:', err);
      }
    }
  },
  { immediate: true }
);

async function handleVerifyVoucher() {
  if (!props.voucher || isVerifying.value) return;
  isVerifying.value = true;
  try {
    const res = await apiFetch('/api/v1/redemption/verify-coupon', {
      method: 'POST',
      body: JSON.stringify({ qr_voucher_code: props.voucher.qr_voucher_code })
    });
    const result = await res.json();
    if (result.code === 200) {
      emit('verified', result.data);
    } else {
      alert(result.message);
    }
  } catch (err) {
    alert('核銷失敗: ' + err.message);
  } finally {
    isVerifying.value = false;
  }
}

function formatTime(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
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
  transform: scale(0.95);
}
</style>

