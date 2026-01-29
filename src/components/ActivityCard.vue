<template>
  <div 
    class="activity-card" 
    :class="{ 'disabled': disabled && status !== 'active' }"
    @click="handleClick"
  >
    <div class="card-content">
        <h3 class="title">{{ title }}</h3>
        <div class="status-row">
             <span class="status-dot" :class="status"></span>
             <span class="status-text">{{ statusText }}</span>
        </div>
    </div>
    
    <div class="right-col">
        <span v-if="status !== 'done'" class="points">{{ points }} min</span> <!-- Using points as min for design match or similar -->
        <div v-else class="done-icon">✓</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: String,
  points: Number,
  status: { type: String, default: 'pending' }, // pending, active, done
  disabled: Boolean
});

const emit = defineEmits(['click']);

const statusText = computed(() => {
    return props.status.charAt(0).toUpperCase() + props.status.slice(1);
});

const handleClick = () => {
    if (!props.disabled || props.status === 'active') {
        emit('click');
    }
};
</script>

<style scoped>
.activity-card {
  background-color: #E8EEDF;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: transform 0.1s, opacity 0.2s;
}

.activity-card:active {
    transform: scale(0.98);
}

.activity-card.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.card-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
}

.status-row {
    display: flex;
    align-items: center;
    gap: 6px;
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.status-dot.pending { background-color: #3498db; }
.status-dot.active { background-color: #9b59b6; }
.status-dot.done { background-color: #42b883; }

.status-text {
    font-size: 12px;
    color: #7f8c8d;
}

.right-col {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    border-left: 1px solid rgba(0,0,0,0.1);
    padding-left: 16px;
    min-width: 40px;
    height: 100%;
}

.points {
    font-size: 14px;
    font-weight: 700;
    color: #1a1a1a;
}

.done-icon {
    color: #42b883;
    font-weight: bold;
    font-size: 18px;
}
</style>
