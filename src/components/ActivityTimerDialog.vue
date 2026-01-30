<template>
  <div class="overlay">
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
                 <span>{{ statusText }}</span>
             </div>
         </div>

         <div class="actions">
             <button v-if="!isActive && !isDone" @click="start" class="btn-primary start">Start</button>
             <button v-else-if="isActive" @click="finish" class="btn-primary finish">Finish</button>
             <button v-else @click="close" class="btn-primary close-action">Close</button>
         </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted, onMounted } from 'vue';
import { useActivityStore } from '../stores/activityStore'; 

// We accept activity as prop from App.vue (state from store passed down)
const props = defineProps({
  activity: Object
});

const store = useActivityStore();
// No emits needed if calling store directly? 
// Or emit 'close' so App.vue can handle it?
// App.vue listens to @close="store.closeActivity()".
const emit = defineEmits(['close']);

const timerInterval = ref(null);
const elapsedSeconds = ref(0);

const isActive = computed(() => props.activity?.status === 'active');
const isDone = computed(() => props.activity?.status === 'done');

const statusClass = computed(() => {
    if (isDone.value) return 'done';
    if (isActive.value) return 'active';
    return 'pending';
});

const statusText = computed(() => {
    if (isDone.value) return 'Done';
    if (isActive.value) return 'Active';
    return 'Pending';
});

const formattedTime = computed(() => {
    let seconds = elapsedSeconds.value;
    // If just opened and active, we need to sync with startTime
    // If just opened and done, sync with duration
    const act = props.activity;
    if (!act) return "00:00:00";
    
    if (isDone.value && act.duration) {
         if (seconds === 0) seconds = act.duration * 60; 
    }

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});

const formattedDate = computed(() => {
    if (!props.activity?.completedAt) return 'Today';
    const date = new Date(props.activity.completedAt);
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
    if (!props.activity?.startedAt || !props.activity?.completedAt) return '00:00 - 00:00';
    const format = (ts) => {
        const d = new Date(ts);
        return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    };
    return `${format(props.activity.startedAt)} - ${format(props.activity.completedAt)}`; 
});

const startTimerTick = () => {
    if (timerInterval.value) clearInterval(timerInterval.value);
    timerInterval.value = setInterval(() => {
        elapsedSeconds.value++;
    }, 1000);
};

const syncTimer = () => {
    const act = props.activity;
    if (act?.startTime) {
        const now = Date.now();
        elapsedSeconds.value = Math.floor((now - act.startTime) / 1000);
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

// Watch for activity changes (if store updates ref)
import { watch } from 'vue';
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
    // syncTimer auto runs via watcher
};

const finish = async () => {
    await store.finishActivity();
    if (timerInterval.value) clearInterval(timerInterval.value);
    // User stays on dialog to see done state
};
</script>

/* Full Screen Dialog Styles */
.dialog-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2000;
    background: transparent; /* Wrapper */
    display: flex;
    justify-content: center;
    align-items: flex-end; /* Or stretch */
}

.dialog {
    background: #f8faed; /* Opaque bg */
    width: 100%;
    height: 100%;
    /* border-radius: 0;  Fill screen usually means no radius at top if full height? Or maybe rounded top like a sheet? User: "fill the entire space". I will use 0 radius or small radius if it feels like a card. User said "until it reaches the top of the screen". Usually implies full coverage. Let's stick to full rect or very top rounded. */
    border-radius: 0; 
    padding: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
    overflow-y: auto; /* Scrollable if needed */
}

/* Header/Close */
header {
    width: 100%;
    display: flex;
    justify-content: flex-start;
    margin-bottom: 20px;
    padding-top: 20px; /* Safe area */
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
    margin-bottom: 60px;
    text-align: center;
    width: 100%;
}

.timer-display {
    width: 240px;
    height: 240px;
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
    margin-bottom: auto; 
}

/* Info Rows */
.info-row {
    background: #E6E7E9;
    padding: 18px 24px;
    border-radius: 99px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
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
    margin-bottom: 24px;
    width: 100%;
    box-sizing: border-box;
    color: #5BA874; 
}

.status-summary .info-left {
    color: inherit;
}

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

/* Actions */
.actions {
    width: 100%;
    padding-bottom: 40px; /* Bottom padding */
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

.btn-primary:active, .btn-primary:focus {
    background-color: var(--text-color); 
}

.btn-primary.close-action {
    background-color: var(--text-color); 
}

