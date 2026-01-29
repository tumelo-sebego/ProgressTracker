<template>
  <div class="circular-progress">
    <svg :width="size" :height="size" class="progress-ring">
      <circle
        class="progress-ring__circle-bg"
        :stroke="bgColor"
        :stroke-width="strokeWidth"
        fill="transparent"
        :r="radius"
        :cx="size / 2"
        :cy="size / 2"
      />
      <circle
        class="progress-ring__circle"
        :stroke="color"
        :stroke-width="strokeWidth"
        fill="transparent"
        :r="radius"
        :cx="size / 2"
        :cy="size / 2"
        :style="{ strokeDasharray: circumference, strokeDashoffset: strokeDashoffset }"
      />
    </svg>
    <div class="progress-text">
        <span class="percentage">{{ percentage }}%</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  size: { type: Number, default: 200 },
  strokeWidth: { type: Number, default: 15 },
  percentage: { type: Number, default: 0 },
  color: { type: String, default: '#42b883' },
  bgColor: { type: String, default: '#1a1a1a' }
});

const radius = computed(() => (props.size / 2) - (props.strokeWidth / 2));
const circumference = computed(() => 2 * Math.PI * radius.value);
const strokeDashoffset = computed(() => {
  return circumference.value - (props.percentage / 100) * circumference.value;
});
</script>

<style scoped>
.circular-progress {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.progress-ring__circle {
  transition: stroke-dashoffset 0.5s ease-in-out;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
  stroke-linecap: round;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.percentage {
  font-size: 48px;
  font-weight: 700;
  color: #42b883;
}
</style>
