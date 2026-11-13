<template>
  <div class="relative w-full flex flex-col items-center justify-center py-6 select-none overflow-hidden">
    <!-- Atmospheric subtle glow -->
    <div
      class="absolute w-72 h-72 rounded-full filter blur-3xl pointer-events-none transition-all duration-1000"
      :class="glowColorClass"
    ></div>

    <!-- Tree level badge -->
    <div class="z-10 mb-2 flex items-center gap-2 px-3 py-1 bg-white/80 backdrop-blur-sm border border-shiraki-dark rounded-full shadow-sm">
      <span class="inline-block w-2 h-2 rounded-full bg-wakatake"></span>
      <span class="text-xs font-serif font-bold text-sumikuro">
        {{ levelInfo.levelName }} ・ Lv.{{ levelInfo.level }}
      </span>
      <span v-if="levelInfo.isMaxLevel" class="text-[10px] text-kohaku font-semibold bg-kohaku/10 px-1.5 py-0.5 rounded-full">
        最高位
      </span>
    </div>

    <!-- Interactive Tree SVG Artwork Canvas -->
    <div class="relative w-64 h-64 flex items-center justify-center cursor-pointer group" @click="handleWaterClick">
      <!-- Water Droplet Dropping Animation -->
      <transition name="drop">
        <div
          v-if="isWateringAnimation"
          class="absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none text-blue-400 text-3xl animate-bounce"
        >
          💧
        </div>
      </transition>

      <!-- Water Ripple Expanding Waves -->
      <div
        v-if="isWateringAnimation"
        class="absolute bottom-8 left-1/2 -translate-x-1/2 w-32 h-16 rounded-full border-2 border-emerald-400/60 animate-water-ripple pointer-events-none z-20"
      ></div>

      <!-- Floating Exp Gain Indicator -->
      <transition name="fade-up">
        <div
          v-if="showExpFloat"
          class="absolute top-8 left-1/2 -translate-x-1/2 z-40 bg-wakatake text-white text-xs font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap"
        >
          +{{ lastGainedExp }} 成長養分 🌿
        </div>
      </transition>

      <!-- SVG Tree depending on 5 Stages -->
      <svg
        viewBox="0 0 240 240"
        class="w-full h-full transform transition-transform duration-700 group-hover:scale-105"
        :class="{ 'animate-bamboo-sway': !isWateringAnimation }"
      >
        <!-- Defs / Gradients -->
        <defs>
          <!-- Bamboo Gradient -->
          <linearGradient id="bambooGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#619B73" />
            <stop offset="100%" stop-color="#3A6347" />
          </linearGradient>

          <!-- Golden Fruit Gradient -->
          <linearGradient id="goldFruitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFDF88" />
            <stop offset="70%" stop-color="#D49B48" />
            <stop offset="100%" stop-color="#9C6B1C" />
          </linearGradient>

          <!-- Ink Stone (硯石) Gradient -->
          <linearGradient id="stoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#4B4E53" />
            <stop offset="50%" stop-color="#333538" />
            <stop offset="100%" stop-color="#232426" />
          </linearGradient>

          <!-- Shadow -->
          <radialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="rgba(43,45,47,0.25)" />
            <stop offset="100%" stop-color="rgba(43,45,47,0)" />
          </radialGradient>
        </defs>

        <!-- Ground Shadow -->
        <ellipse cx="120" cy="208" rx="70" ry="12" fill="url(#shadowGrad)" />

        <!-- Japanese Ink Stone (硯石座) -->
        <path
          d="M 65 198 Q 120 190 175 198 L 180 205 Q 120 213 60 205 Z"
          fill="url(#stoneGrad)"
          stroke="#202123"
          stroke-width="1.5"
        />
        <ellipse cx="120" cy="198" rx="55" ry="8" fill="#3E4145" />
        <!-- Stone moss/texture accents -->
        <ellipse cx="95" cy="197" rx="10" ry="3" fill="#619B73" opacity="0.4" />
        <ellipse cx="145" cy="199" rx="14" ry="3.5" fill="#4A7C59" opacity="0.3" />

        <!-- STAGE 1: 破土嫩芽 (Bamboo Sprout / 筍芽) -->
        <g v-if="levelInfo.level === 1">
          <!-- Soil mound -->
          <ellipse cx="120" cy="194" rx="28" ry="6" fill="#5A4736" opacity="0.8" />
          <!-- Sprout body -->
          <path
            d="M 120 145 C 112 165 106 182 108 194 Q 120 196 132 194 C 134 182 128 165 120 145 Z"
            fill="url(#bambooGrad)"
            stroke="#3A6347"
            stroke-width="1.5"
          />
          <!-- Sprout leaf scales -->
          <path d="M 112 178 Q 120 170 128 178" fill="none" stroke="#A7D4B4" stroke-width="1.5" />
          <path d="M 115 162 Q 120 155 125 162" fill="none" stroke="#A7D4B4" stroke-width="1.5" />
          <!-- Young shoots opening -->
          <path
            d="M 120 146 C 114 135 102 130 96 133 C 94 138 106 142 120 146 Z"
            fill="#7FB993"
            stroke="#4A7C59"
            stroke-width="1"
          />
          <path
            d="M 120 146 C 126 133 138 128 144 131 C 146 136 134 142 120 146 Z"
            fill="#8EC8A2"
            stroke="#4A7C59"
            stroke-width="1"
          />
          <!-- Morning dew on tip -->
          <circle cx="120" cy="142" r="2.5" fill="#E0F2FE" opacity="0.9" />
        </g>

        <!-- STAGE 2: 茁壯若竹 (Young Bamboo) -->
        <g v-else-if="levelInfo.level === 2">
          <!-- Main Bamboo Culm -->
          <path
            d="M 116 195 L 117 150 L 118 105 L 119 65"
            stroke="url(#bambooGrad)"
            stroke-width="8"
            stroke-linecap="round"
          />
          <path
            d="M 127 195 L 126 150 L 125 105 L 124 65"
            stroke="url(#bambooGrad)"
            stroke-width="6"
            stroke-linecap="round"
          />
          <!-- Bamboo Nodes (竹節) -->
          <line x1="112" y1="168" x2="120" y2="168" stroke="#2B4E35" stroke-width="2.5" />
          <line x1="113" y1="135" x2="121" y2="135" stroke="#2B4E35" stroke-width="2.5" />
          <line x1="114" y1="98" x2="122" y2="98" stroke="#2B4E35" stroke-width="2.5" />

          <line x1="123" y1="162" x2="130" y2="162" stroke="#2B4E35" stroke-width="2" />
          <line x1="122" y1="128" x2="129" y2="128" stroke="#2B4E35" stroke-width="2" />
          <line x1="121" y1="92" x2="127" y2="92" stroke="#2B4E35" stroke-width="2" />

          <!-- Graceful Bamboo Leaves -->
          <!-- Left side leaves -->
          <path d="M 115 135 Q 90 120 72 135 Q 95 138 115 135 Z" fill="#619B73" />
          <path d="M 115 135 Q 85 138 68 152 Q 92 148 115 135 Z" fill="#4A7C59" />

          <!-- Right side leaves -->
          <path d="M 126 128 Q 155 115 174 130 Q 150 134 126 128 Z" fill="#71AC83" />
          <path d="M 126 128 Q 160 130 178 144 Q 152 140 126 128 Z" fill="#4A7C59" />

          <!-- Top canopy leaves -->
          <path d="M 120 65 Q 100 45 80 55 Q 105 60 120 65 Z" fill="#7CBD91" />
          <path d="M 120 65 Q 120 35 122 30 Q 124 45 120 65 Z" fill="#58936B" />
          <path d="M 120 65 Q 140 45 160 52 Q 138 60 120 65 Z" fill="#6DB081" />
          <path d="M 122 92 Q 150 78 165 90 Q 142 94 122 92 Z" fill="#619B73" />
        </g>

        <!-- STAGE 3: 茂盛成樹 (Lush Bamboo Bonsai) -->
        <g v-else-if="levelInfo.level === 3">
          <!-- Triple Culm Bamboo Grove -->
          <path d="M 105 195 L 107 130 L 110 60" stroke="#3A6347" stroke-width="6" stroke-linecap="round" />
          <path d="M 120 195 L 121 115 L 122 45" stroke="#4A7C59" stroke-width="8" stroke-linecap="round" />
          <path d="M 135 195 L 133 130 L 130 65" stroke="#3A6347" stroke-width="5" stroke-linecap="round" />

          <!-- Dense Bamboo Foliage Clusters -->
          <!-- Cloud 1 (Left) -->
          <path d="M 108 120 Q 70 100 50 120 Q 80 128 108 120 Z" fill="#4A7C59" />
          <path d="M 108 120 Q 60 122 42 140 Q 75 136 108 120 Z" fill="#3D684A" />
          <path d="M 109 95 Q 65 75 48 95 Q 80 102 109 95 Z" fill="#619B73" />

          <!-- Cloud 2 (Right) -->
          <path d="M 132 120 Q 170 100 190 120 Q 160 128 132 120 Z" fill="#4A7C59" />
          <path d="M 132 120 Q 180 122 198 140 Q 165 136 132 120 Z" fill="#3D684A" />
          <path d="M 130 90 Q 175 70 192 90 Q 160 98 130 90 Z" fill="#619B73" />

          <!-- Canopy Peak -->
          <path d="M 122 45 Q 90 20 65 35 Q 100 42 122 45 Z" fill="#7CBD91" />
          <path d="M 122 45 Q 122 10 124 8 Q 126 25 122 45 Z" fill="#58936B" />
          <path d="M 122 45 Q 155 20 175 32 Q 145 42 122 45 Z" fill="#6DB081" />
          <path d="M 120 70 Q 155 52 175 68 Q 145 74 120 70 Z" fill="#508561" />
          <path d="M 120 70 Q 85 52 65 68 Q 95 74 120 70 Z" fill="#508561" />
        </g>

        <!-- STAGE 4: 開花之樹 (Flowering Bamboo & Zen Tree) -->
        <g v-else-if="levelInfo.level === 4">
          <!-- Main Stems -->
          <path d="M 106 195 L 108 125 L 112 55" stroke="#3A6347" stroke-width="7" stroke-linecap="round" />
          <path d="M 120 195 L 121 115 L 122 42" stroke="#4A7C59" stroke-width="8" stroke-linecap="round" />
          <path d="M 134 195 L 132 125 L 128 60" stroke="#3A6347" stroke-width="6" stroke-linecap="round" />

          <!-- Lush Foliage -->
          <path d="M 108 115 Q 65 95 45 115 Q 75 122 108 115 Z" fill="#4A7C59" />
          <path d="M 132 115 Q 175 95 195 115 Q 165 122 132 115 Z" fill="#4A7C59" />
          <path d="M 122 42 Q 90 18 68 32 Q 102 38 122 42 Z" fill="#6DB081" />
          <path d="M 122 42 Q 154 18 174 30 Q 144 38 122 42 Z" fill="#6DB081" />

          <!-- Japanese Zen White/Pink Blossom Buds (和風清雅花朵) -->
          <g v-for="(flower, index) in flowers" :key="index">
            <circle :cx="flower.x" :cy="flower.y" r="5" fill="#FFF5F5" stroke="#E5B5B5" stroke-width="1" />
            <circle :cx="flower.x" :cy="flower.y" r="2" fill="#E88A8A" />
            <!-- Petals -->
            <ellipse :cx="flower.x - 3" :cy="flower.y" rx="2.5" ry="1.5" fill="#FFF8F8" />
            <ellipse :cx="flower.x + 3" :cy="flower.y" rx="2.5" ry="1.5" fill="#FFF8F8" />
            <ellipse :cx="flower.x" :cy="flower.y - 3" rx="1.5" ry="2.5" fill="#FFF8F8" />
            <ellipse :cx="flower.x" :cy="flower.y + 3" rx="1.5" ry="2.5" fill="#FFF8F8" />
          </g>
        </g>

        <!-- STAGE 5: 結實金樹 (Golden Fruit Health Tree) -->
        <g v-else-if="levelInfo.level === 5">
          <!-- Golden Aura Background -->
          <circle cx="120" cy="110" r="75" fill="#FFF3D6" opacity="0.45" filter="blur(6px)" />

          <!-- Majestic Tree Trunk & Canopy -->
          <path d="M 118 195 L 120 120 L 122 40" stroke="#3A6347" stroke-width="10" stroke-linecap="round" />
          <path d="M 106 195 L 102 120 L 110 55" stroke="#2B4E35" stroke-width="7" stroke-linecap="round" />
          <path d="M 134 195 L 138 120 L 130 55" stroke="#2B4E35" stroke-width="7" stroke-linecap="round" />

          <!-- Dense Canopy -->
          <path d="M 122 40 Q 80 15 50 35 Q 95 44 122 40 Z" fill="#619B73" />
          <path d="M 122 40 Q 164 15 190 35 Q 148 44 122 40 Z" fill="#619B73" />
          <path d="M 102 110 Q 55 90 35 112 Q 72 120 102 110 Z" fill="#4A7C59" />
          <path d="M 138 110 Q 185 90 205 112 Q 168 120 138 110 Z" fill="#4A7C59" />

          <!-- Golden Fruits (琥珀金果實) -->
          <g v-for="(fruit, index) in goldenFruits" :key="'fruit-' + index">
            <!-- Glow -->
            <circle :cx="fruit.x" :cy="fruit.y" r="8" fill="#FDE68A" opacity="0.6" />
            <!-- Fruit Body -->
            <circle :cx="fruit.x" :cy="fruit.y" r="6" fill="url(#goldFruitGrad)" stroke="#B57E2F" stroke-width="1" />
            <!-- Highlight -->
            <circle :cx="fruit.x - 2" :cy="fruit.y - 2" r="1.5" fill="#FFFFFF" opacity="0.8" />
            <!-- Stem -->
            <path :d="`M ${fruit.x} ${fruit.y - 6} Q ${fruit.x + 2} ${fruit.y - 9} ${fruit.x + 4} ${fruit.y - 10}`" fill="none" stroke="#5A4736" stroke-width="1" />
          </g>

          <!-- Golden sparkles around -->
          <text x="50" y="70" font-size="12" fill="#D49B48" opacity="0.8">✦</text>
          <text x="185" y="60" font-size="14" fill="#D49B48" opacity="0.9">✧</text>
          <text x="120" y="24" font-size="16" fill="#D49B48" opacity="0.85">✦</text>
        </g>
      </svg>
    </div>

    <!-- Tree EXP Progress Bar -->
    <div class="w-full max-w-xs mt-3 px-4">
      <div class="flex items-center justify-between text-[11px] text-chausu font-serif mb-1">
        <span>滋養經驗：{{ levelInfo.currentExp }} EXP</span>
        <span v-if="!levelInfo.isMaxLevel">晉級：{{ levelInfo.nextLevelExp }} EXP</span>
        <span v-else class="text-kohaku">已抵圓滿</span>
      </div>
      <div class="w-full h-2 bg-shiraki-dark rounded-full overflow-hidden p-0.5">
        <div
          class="h-full bg-gradient-to-r from-wakatake-light to-wakatake rounded-full transition-all duration-700 ease-out"
          :style="{ width: expPercentage + '%' }"
        ></div>
      </div>
    </div>

    <!-- Watering Action Area -->
    <div class="mt-4 text-center">
      <p class="text-xs text-chausu font-serif tracking-wider mb-2">
        「 今日已累積 <span class="font-bold text-wakatake text-sm">{{ pendingDew }}</span> 滴露水，點擊靜心澆灌 」
      </p>

      <button
        @click="handleWaterClick"
        :disabled="pendingDew <= 0 || isWatering"
        class="inline-flex items-center gap-2 px-6 py-2.5 rounded-pill font-serif text-sm transition-all duration-300 shadow-sm active:scale-95"
        :class="[
          pendingDew > 0
            ? 'bg-wakatake hover:bg-wakatake-dark text-white shadow-wakatake/20 hover:shadow-md'
            : 'bg-shiraki text-chausu cursor-not-allowed border border-shiraki-dark'
        ]"
      >
        <span class="text-base">💧</span>
        <span>{{ isWatering ? '滋養中...' : '輕觸餵養' }}</span>
        <span
          v-if="pendingDew > 0"
          class="ml-1 px-1.5 py-0.5 text-[10px] bg-white/25 rounded-full font-sans"
        >
          x{{ pendingDew }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import confetti from 'canvas-confetti';

const props = defineProps({
  levelInfo: {
    type: Object,
    required: true,
    default: () => ({
      level: 2,
      levelName: '茁壯若竹',
      currentExp: 120,
      nextLevelExp: 150,
      isMaxLevel: false
    })
  },
  pendingDew: {
    type: Number,
    default: 2
  }
});

const emit = defineEmits(['water']);

const isWatering = ref(false);
const isWateringAnimation = ref(false);
const showExpFloat = ref(false);
const lastGainedExp = ref(10);

// Blossom positions for Level 4
const flowers = [
  { x: 58, y: 110 },
  { x: 92, y: 88 },
  { x: 148, y: 85 },
  { x: 182, y: 112 },
  { x: 122, y: 34 },
  { x: 78, y: 46 },
  { x: 162, y: 44 }
];

// Golden fruit positions for Level 5
const goldenFruits = [
  { x: 62, y: 105 },
  { x: 96, y: 82 },
  { x: 145, y: 80 },
  { x: 178, y: 108 },
  { x: 122, y: 32 },
  { x: 80, y: 48 },
  { x: 160, y: 45 },
  { x: 120, y: 115 }
];

const glowColorClass = computed(() => {
  if (props.levelInfo.level === 5) return 'bg-amber-100/60';
  if (props.levelInfo.level >= 3) return 'bg-emerald-100/50';
  return 'bg-emerald-50/40';
});

const expPercentage = computed(() => {
  if (props.levelInfo.isMaxLevel) return 100;
  const current = props.levelInfo.currentExp || 0;
  const target = props.levelInfo.nextLevelExp || 100;
  const pct = Math.min(100, Math.max(5, (current / target) * 100));
  return Math.round(pct);
});

function handleWaterClick() {
  if (props.pendingDew <= 0 || isWatering.value) return;

  isWatering.value = true;
  isWateringAnimation.value = true;

  // Trigger water drop animation
  setTimeout(() => {
    isWateringAnimation.value = false;
    showExpFloat.value = true;

    emit('water', {
      onSuccess: (data) => {
        isWatering.value = false;
        lastGainedExp.value = data?.exp_gained || 10;

        if (data?.is_level_up) {
          triggerLevelUpCelebration();
        }

        setTimeout(() => {
          showExpFloat.value = false;
        }, 1800);
      },
      onError: () => {
        isWatering.value = false;
        showExpFloat.value = false;
      }
    });
  }, 700);
}

function triggerLevelUpCelebration() {
  confetti({
    particleCount: 60,
    spread: 60,
    origin: { y: 0.6 },
    colors: ['#4A7C59', '#619B73', '#D49B48', '#FAF8F5']
  });
}
</script>

<style scoped>
.drop-enter-active {
  transition: all 0.5s cubic-bezier(0.55, 0.055, 0.675, 0.19);
}
.drop-enter-from {
  transform: translate(-50%, -30px);
  opacity: 0;
}
.drop-enter-to {
  transform: translate(-50%, 60px);
  opacity: 1;
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.4s ease-out;
}
.fade-up-enter-from {
  opacity: 0;
  transform: translate(-50%, 10px);
}
.fade-up-leave-to {
  opacity: 0;
  transform: translate(-50%, -15px);
}
</style>

