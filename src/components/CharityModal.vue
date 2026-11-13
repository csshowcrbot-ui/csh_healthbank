<template>
  <transition name="modal-fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sumikuro/50 backdrop-blur-sm"
      @click.self="close"
    >
      <!-- Washi Certificate Container -->
      <div
        class="relative w-full max-w-sm bg-[#FCFAF7] border-4 border-[#E2D6C3] rounded-2xl p-6 shadow-2xl overflow-hidden text-sumikuro select-none"
        style="box-shadow: 0 10px 40px rgba(74, 124, 89, 0.15);"
      >
        <!-- Subtle Washi Inner Border -->
        <div class="absolute inset-1.5 border border-[#D5C2A5] rounded-xl pointer-events-none opacity-60"></div>
        <div class="absolute top-3 left-3 text-[#D5C2A5] text-xs">❖</div>
        <div class="absolute top-3 right-3 text-[#D5C2A5] text-xs">❖</div>
        <div class="absolute bottom-3 left-3 text-[#D5C2A5] text-xs">❖</div>
        <div class="absolute bottom-3 right-3 text-[#D5C2A5] text-xs">❖</div>

        <!-- Header -->
        <div class="text-center pt-2 pb-4">
          <div class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-nadeshiko/10 text-nadeshiko mb-2 text-xl">
            ❦
          </div>
          <h3 class="font-serif text-lg font-bold tracking-widest text-sumikuro">
            前 山 善 行 ・ 感 謝 狀
          </h3>
          <p class="text-[11px] text-chausu font-serif tracking-wider mt-0.5">
            南投縣私立前山社會福利慈善事業基金會
          </p>
        </div>

        <!-- Certificate Body -->
        <div class="space-y-3 font-serif text-xs leading-relaxed text-sumikuro/90 bg-white/60 p-4 rounded-lg border border-shiraki-dark">
          <p>
            敬致 同仁 <span class="font-bold text-sumikuro text-sm">{{ donorName }}</span>（{{ deptName }} / 工號 {{ employeeNo }}）：
          </p>
          <p class="text-justify text-xs indent-4">
            感念您平日悉心照護病患，並藉由蔬食運動等日常修養，呈獻身心健康所積累之
            <span class="font-bold text-nadeshiko">{{ donatedPoints }} pt</span>
            點數資產。
          </p>
          <div class="my-2 p-2.5 bg-shiraki-light rounded border border-shiraki-dark flex items-center justify-between">
            <div>
              <div class="text-[10px] text-chausu">同仁自發捐贈</div>
              <div class="font-serif font-bold text-sm text-nadeshiko">{{ donatedPoints }} 點</div>
            </div>
            <div class="text-xs text-chausu">➔ 配對加碼 ➔</div>
            <div class="text-right">
              <div class="text-[10px] text-chausu">竹山秀傳全額代捐</div>
              <div class="font-serif font-bold text-sm text-wakatake">NT$ {{ matchingFund }} 元</div>
            </div>
          </div>
          <p class="text-justify text-[11px] text-chausu leading-normal indent-4">
            全數善款將專款用於南投偏鄉弱勢長者居家照護與健康送暖專案。日日微善，聚沙成塔。
          </p>
        </div>

        <!-- Stamps & Footer -->
        <div class="mt-4 pt-2 flex items-center justify-between px-2">
          <!-- Foundation Red Stamp -->
          <div class="hanko-stamp-round w-14 h-14 text-[9px] leading-tight flex-col border-nadeshiko text-nadeshiko">
            <span>前山基金</span>
            <span>善行之印</span>
          </div>

          <!-- Hospital Red Stamp -->
          <div class="hanko-stamp px-2 py-1 text-[10px] text-nadeshiko border-nadeshiko">
            竹山秀傳代捐
          </div>

          <div class="text-right text-[10px] text-chausu font-serif">
            <div>核發單號：{{ txId }}</div>
            <div>中華民國 {{ new Date().getFullYear() - 1911 }} 年 {{ new Date().getMonth() + 1 }} 月 {{ new Date().getDate() }} 日</div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-6 flex gap-2">
          <button
            @click="close"
            class="flex-1 py-2 rounded-pill font-serif text-xs bg-wakatake text-white hover:bg-wakatake-dark shadow-sm transition-colors"
          >
            心意收納・銘感在心
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  isOpen: Boolean,
  donorName: {
    type: String,
    default: '陳小嵐'
  },
  employeeNo: {
    type: String,
    default: 'E2108'
  },
  deptName: {
    type: String,
    default: '急診護理部'
  },
  donatedPoints: {
    type: Number,
    default: 100
  },
  matchingFund: {
    type: Number,
    default: 200
  },
  txId: {
    type: String,
    default: 'TX-20261030-9981'
  }
});

const emit = defineEmits(['close']);

function close() {
  emit('close');
}
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>

