<template>
  <div class="dialog-container">
    <div class="dialog">
        <header>
             <button class="close-btn" @click="close">×</button>
        </header>

        <h2 class="activity-title">{{ activity.title }}</h2>

        <div class="timer-display">
            {{ formattedTime }}
        </div>

        <div class="info-row">
            <div class="info-left">
                <span class="bolt-icon">⚡</span>
                <span>Activity Points</span>
            </div>
            <div class="info-right">
                <span class="divider">|</span>
                <span class="points-val">{{ activity.points }}</span>
            </div>
        </div>

        <!-- Date Row (Only if Done) -->
        <div class="info-row" v-if="isDone">
             <div class="info-left">
                <span class="icon-calendar">📅</span> <!-- Placeholder icon or use SVG if available -->
                <span>{{ formattedDate }}</span>
            </div>
            <div class="info-right">
                <span class="divider">|</span>
                <span class="time-range">{{ formattedTimeRange }}</span>
            </div>
        </div>

         <div class="status-summary">
             <div class="info-left">
                 <span class="status-dot" :class="statusClass"></span>
                 <span :class="statusClass" class="status-text">{{ statusText }}</span>
             </div>
         </div>

         <div class="actions" v-if="!isDone && !isExpired">
             <button v-if="!isActive" @click="start" :disabled="store.isAnyRunning" class="btn-primary start">Start</button>
             <button v-else @click="finish" class="btn-primary finish">Finish</button>
         </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted, onMounted, watch } from 'vue';
import { useActivityStore } from '../stores/activityStore'; 

// We accept activity as prop from App.vue (state from store passed down)
const props = defineProps({
  activity: Object
});

const store = useActivityStore();
const emit = defineEmits(['close']);

const timerInterval = ref(null);
const elapsedSeconds = ref(0);

const isActive = computed(() => props.activity?.status === 'active');
const isDone = computed(() => props.activity?.status === 'done');
const isExpired = computed(() => props.activity?.status === 'expired');

const statusClass = computed(() => {
    if (isDone.value) return 'done';
    if (isActive.value) return 'active';
    return 'pending';
});

const statusText = computed(() => {
    if (isDone.value) return 'Done';
    if (isActive.value) return 'Active';
    if (isExpired.value) return 'Expired';
    return 'Pending';
});

const formattedTime = computed(() => {
    let seconds = elapsedSeconds.value;
    const act = props.activity;
    if (!act) return "00:00:00";
    
    // If activity is done and has a duration, use it if seconds not set
    if (isDone.value && act.duration) {
         if (seconds === 0) seconds = act.duration * 60; 
    }

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});

const formattedDate = computed(() => {
    // Prefer the new 'date' field, fallback to completedAt or 'Today'
    const dateSource = props.activity?.date || props.activity?.completedAt;
    if (!dateSource) return 'Today';
    
    const date = new Date(dateSource);
    const d = date.getDate();
    const m = date.toLocaleDateString('en-GB', { month: 'long' });
    
    const j = d % 10, k = d % 100;
    let suffix = "th";
    if (j == 1 && k != 11) suffix = "st";
    else if (j == 2 && k != 12) suffix = "nd";
    else if (j == 3 && k != 13) suffix = "rd";
    
    return `${d}${suffix} ${m}`;
});

const formattedTimeRange = computed(() => {
    // Prefer start_time / end_time
    const start = props.activity?.start_time || props.activity?.startedAt;
    const end = props.activity?.end_time || props.activity?.completedAt;
    
    if (!start || !end) return '00:00 - 00:00';
    
    const format = (ts) => {
        const d = new Date(ts);
        return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    };
    return `${format(start)} - ${format(end)}`; 
});

const startTimerTick = () => {
    if (timerInterval.value) clearInterval(timerInterval.value);
    timerInterval.value = setInterval(() => {
        elapsedSeconds.value++;
    }, 1000);
};

const syncTimer = () => {
    const act = props.activity;
    // Prefer start_time
    const startTimeVal = act?.start_time || act?.startTime;
    
    if (act?.status === 'active' && startTimeVal) {
        const now = Date.now();
        elapsedSeconds.value = Math.floor((now - startTimeVal) / 1000);
        startTimerTick();
    } else if (act?.status === 'done' && act.duration) {
         elapsedSeconds.value = act.duration * 60; 
         if (timerInterval.value) clearInterval(timerInterval.value);
    } else {
        elapsedSeconds.value = 0;
        if (timerInterval.value) clearInterval(timerInterval.value);
    }
}

onMounted(() => {
    syncTimer();
});

watch(() => props.activity, () => {
    syncTimer();
}, { deep: true });

onUnmounted(() => {
    if (timerInterval.value) clearInterval(timerInterval.value);
});

const close = () => {
    emit('close');
};

const start = async () => {
    await store.startActivity();
};

const finish = async () => {
    await store.finishActivity();
    if (timerInterval.value) clearInterval(timerInterval.value);
};
</script>

<style scoped>
/* Full Screen Dialog Styles */
.dialog-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2000;
    background: transparent; 
    display: flex;
    justify-content: center;
    align-items: flex-end; 
}

.dialog {
    --gap-x: 32px;
    --gap-y: 16px;

    background: #f8faed; 
    width: 100%;
    height: 100%;
    border-radius: 0; 
    padding: 32px;
    padding-bottom: calc(32px + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
    overflow-y: hidden; /* Prevent vertical scroll */
}

/* Header/Close */
header {
    width: 100%;
    display: flex;
    justify-content: flex-start;
}

.close-btn {
    background: none;
    border: none;
    font-size: 36px;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    color: #1a1a1a;
}

.activity-title {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: var(--gap-x);
    text-align: center;
    width: 100%;
}

.timer-display {
    width: 210px;
    height: 210px;
    flex-shrink: 0; 
    aspect-ratio: 1 / 1;
    background: #eaeed3;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 42px; 
    font-weight: 700;
    color: #1a1a1a;
    font-feature-settings: "tnum";
    margin-bottom: var(--gap-x);
}

/* Info Rows */
.info-row {
    background: #E6E7E9;
    padding: 18px 24px;
    border-radius: 99px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--gap-y);
    font-size: 15px;
    font-weight: 700;
    width: 100%;
    box-sizing: border-box;
    color: #1a1a1a;
}

.info-left, .info-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.divider { 
    color: #1a1a1a; 
    font-weight: 300;
    font-size: 20px;
    opacity: 0.3;
    margin: 0 8px; 
}

.status-summary {
    background: #E6E7E9;
    padding: 18px 24px;
    border-radius: 99px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 15px;
    font-weight: 700;
    margin-bottom: var(--gap-x);
    width: 100%;
    box-sizing: border-box;
    color: #5BA874; 
}

.status-summary .info-left {
    color: inherit;
}

/* Status dots */
.status-dot {
    width: 18px; 
    height: 18px;
    border-radius: 50%;
    display: inline-block;
}
.status-dot.pending { background-color: #3498db; }
.status-dot.active { background-color: #9b59b6; }
.status-dot.done { 
    background-color: var(--primary-color); 
}
.status-dot.expired { background-color: #e74c3c; }

/* Status Text Colors */
.status-text.pending { color: #3498db; }
.status-text.active { color: #9b59b6; }
.status-text.done { color: var(--primary-color); }
.status-text.expired { color: #e74c3c; }

/* Actions */
.actions {
    width: 100%;
}

.btn-primary {
    width: 100%;
    padding: 20px;
    border-radius: 99px;
    font-size: 16px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;
    background-color: var(--primary-color);
    color: #fff; 
}

.btn-primary.finish{
    background-color: var(--text-color);
}

.btn-primary:active, .btn-primary:focus {
    background-color: var(--text-color); 
}

.btn-primary:disabled {
    background-color: #ccc;
    cursor: not-allowed;
    opacity: 0.6;
    color: var(--text-color);
}

.btn-primary.close-action {
    background-color: var(--text-color); 
}
</style>
