<template>
  <div 
    class="activity-card" 
    :class="{ 'disabled': disabled && status !== 'active' }"
    @click="handleClick"
  >
    <!-- Left Section: Info -->
    <div class="card-left">
        <h3 class="title">{{ title }}</h3>
        <div class="status-row">
             <span class="status-dot" :class="status"></span>
             <span class="status-text">{{ statusDisplay }}</span>
        </div>
    </div>
    
    <!-- Divider -->
    <div class="card-divider"></div>

    <!-- Right Section: Stats/Icon -->
    <div class="card-right">
        <!-- Stats Column -->
        <div v-if="status !== 'active'" class="stat-box">
             <span class="stat-value">{{ formattedDuration.value }}</span>
             <span class="stat-unit">{{ formattedDuration.unit }}</span>
        </div>
        
        <!-- ACTIVE Status: Pulsating Dot -->
        <div v-else class="icon-box">
             <PulsatingDot />
        </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import PulsatingDot from './PulsatingDot.vue';

const props = defineProps({
  title: String,
  points: Number, // Target duration or points
  duration: Number, // Actual recorded duration
  status: { type: String, default: 'pending' }, // pending, active, done, expired
  disabled: Boolean
});

const emit = defineEmits(['click']);

const statusDisplay = computed(() => {
    // Map status to display text if needed
    return props.status.charAt(0).toUpperCase() + props.status.slice(1);
});

// For demo purposes, we might calculate active duration here or receive it.
// Assuming 'duration' prop is passed for done items.
const currentDuration = computed(() => props.duration || 0);

const handleClick = () => {
    if (!props.disabled || props.status === 'active') {
        emit('click');
    }
};

const formattedDuration = computed(() => {
    // If duration is null, fallback to points (which is target duration)
    const totalMinutes = props.duration != null ? props.duration : props.points;
    
    if (totalMinutes >= 60) {
        const hours = Math.floor(totalMinutes / 60);
        return {
            value: hours,
            unit: hours < 2 ? 'hr' : 'hrs'
        };
    }
    
    return {
        value: totalMinutes,
        unit: 'min'
    };
});
</script>

<style scoped>
.activity-card {
  background-color: #eaeed3; 
  border-radius: 20px; /* More rounded */
  padding: 0px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: transform 0.1s;
  min-height: 80px;
}

.activity-card:active {
    transform: scale(0.98);
}

.activity-card.disabled {
    opacity: 0.6;
}

.card-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
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
    gap: 8px;
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.status-dot.pending { background-color: #3498db; } /* Blue/Pending */
.status-dot.done { background-color: var(--primary-color); } /* Green/Done */
.status-dot.active { background-color: #9b59b6; }
.status-dot.expired { background-color: #e74c3c; }

.status-text {
    font-size: 12px;
    color: #888;
    font-weight: 500;
}

.card-divider {
    width: 1px;
    height: 40px;
    background-color: rgba(0,0,0,0.1); /* Subtle vertical line */
    margin: 0 20px;
}

.card-right {
    min-width: 50px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.stat-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1;
}

.stat-value {
    font-size: 20px;
    font-weight: 600;
    color: #1a1a1a;
}

.stat-unit {
    font-size: 11px;
    color: #666;
    margin-top: 2px;
}

.pending-text {
    font-size: 13px;
    color: #3498db;
}

.stopwatch-icon {
    width: 24px;
    height: 24px;
    color: #1a1a1a;
}
</style>
