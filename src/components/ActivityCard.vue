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
        <!-- DONE Status: Duration -->
        <div v-if="status === 'done'" class="stat-box">
            <span class="stat-value">{{ duration != null ? duration : points }}</span>
            <span class="stat-unit">min</span>
        </div>

        <!-- PENDING Status: Points or Icon? User said 'points of that activity (if the activity is still pending)' but image showed icon for one pending. 
             I will default to showing points if provided, else some indicator. -->
        <div v-else-if="status === 'pending'" class="stat-box">
             <span class="stat-value">{{ points }}</span>
             <span class="stat-unit">pts</span>
        </div>

        <!-- ACTIVE Status: Timer/Duration -->
        <div v-else-if="status === 'active'" class="stat-box">
             <span class="stat-value">{{ currentDuration }}</span>
             <span class="stat-unit">min</span>
        </div>

        <!-- EXPIRED/Other: Stopwatch Icon (as requested) 
             User said: "stop-watch icon if activity status is expired"
        -->
        <div v-else class="icon-box">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="stopwatch-icon">
                <path d="M12 2c-4.97 0-9 4.03-9 9 0 4.97 4.03 9 9 9s9-4.03 9-9c0-4.97-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zm1-11h-2v1.17c-.31.11-.59.26-.84.45L9.41 7.89l-1.42 1.42 1.41 1.41.76-.76C10.55 10.32 11.23 10 12 10c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3c0-.36.07-.7.19-1.02l-1.42-1.42C8.32 11.75 8 13.06 8 14.5 8 16.98 10.02 19 12.5 19S17 16.98 17 14.5 14.98 10 12.5 10v-2.83zM15 1h-6v2h6V1z"/>
            </svg>
        </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

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
