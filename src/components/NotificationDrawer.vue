<template>
  <transition name="drawer-slide">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex justify-end bg-sumikuro/40 backdrop-blur-[2px]"
      @click.self="close"
    >
      <div class="relative w-full max-w-sm bg-[#F6F7F9] h-full shadow-2xl flex flex-col overflow-hidden text-sumikuro">
        <!-- LINE Style Header -->
        <div class="p-3.5 bg-[#06C755] text-white flex items-center justify-between shadow">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full bg-white text-[#06C755] flex items-center justify-center font-bold text-xs">
              LINE
            </div>
            <div>
              <h3 class="font-sans text-xs font-bold">竹山秀傳醫院 官方推播</h3>
              <p class="text-[9px] text-emerald-100">LINE Messaging API 自動連動</p>
            </div>
          </div>
          <button @click="close" class="text-white hover:text-emerald-100 text-lg p-1">✕</button>
        </div>

        <!-- Chat / Message Feed -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          <div v-if="notifications.length === 0" class="text-center py-12 text-xs text-chausu font-serif">
            今日尚無新的 LINE 訊息
          </div>

          <div
            v-for="item in notifications"
            :key="item.id"
            class="bg-white p-3.5 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 text-xs space-y-1 relative"
          >
            <div class="flex items-center justify-between text-[10px] text-chausu">
              <span class="font-bold text-sumikuro flex items-center gap-1">
                <span v-if="item.type === 'vege'">🥗</span>
                <span v-else-if="item.type === 'sport'">🏃</span>
                <span v-else-if="item.type === 'charity'">❦</span>
                <span v-else>🌿</span>
                {{ item.title }}
              </span>
              <span>{{ formatTime(item.created_at) }}</span>
            </div>
            <p class="text-xs text-sumikuro/90 leading-relaxed font-sans pt-1">
              {{ item.message }}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-3 bg-white border-t border-gray-200 text-center">
          <span class="text-[10px] text-chausu">
            由 LINE Front-end Framework (LIFF) 提供單一免登體驗
          </span>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  isOpen: Boolean,
  notifications: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close']);

function formatTime(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
}

function close() {
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
</style>

