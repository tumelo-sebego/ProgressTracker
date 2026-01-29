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
            <span class="bolt-icon">⚡</span>
            <span>Activity Points</span>
            <span class="divider">|</span>
            <span class="points-val">{{ activity.points }}</span>
        </div>

         <div class="status-summary">
             <span class="status-dot" :class="isActive ? 'active' : 'pending'"></span>
             <span>{{ isActive ? 'Active' : 'Pending' }}</span>
         </div>

         <div class="actions">
             <button v-if="!isActive" @click="start" class="btn-primary start">Start</button>
             <button v-else @click="finish" class="btn-primary finish">Finish</button>
         </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted, onMounted } from 'vue';

const props = defineProps({
  activity: Object,
  startTime: Number // If passed, implies it's already running
});

const emit = defineEmits(['close', 'start', 'finish']);

const timerInterval = ref(null);
const elapsedSeconds = ref(0);
const isActive = ref(false);

const formattedTime = computed(() => {
    const h = Math.floor(elapsedSeconds.value / 3600);
    const m = Math.floor((elapsedSeconds.value % 3600) / 60);
    const s = elapsedSeconds.value % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});

const startTimerTick = () => {
    timerInterval.value = setInterval(() => {
        elapsedSeconds.value++;
    }, 1000);
};

onMounted(() => {
    if (props.startTime) {
        isActive.value = true;
        // Calculate elapsed time from startTime
        const now = Date.now();
        elapsedSeconds.value = Math.floor((now - props.startTime) / 1000);
        startTimerTick();
    }
});

onUnmounted(() => {
    clearInterval(timerInterval.value);
});

const close = () => {
    emit('close');
};

const start = () => {
    isActive.value = true;
    startTimerTick();
    emit('start', props.activity.id);
};

const finish = () => {
    clearInterval(timerInterval.value);
    emit('finish', props.activity.id);
};
</script>

<style scoped>
.overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: flex-end; /* Mobile style sheet - animate up? */
    z-index: 1000;
}

.dialog {
    background: #F4F6F0;
    width: 100%;
    max-width: 400px;
    height: 80vh;
    border-radius: 24px 24px 0 0;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
}

header {
    width: 100%;
    display: flex;
    justify-content: flex-start;
    margin-bottom: 20px;
}

.close-btn {
    background: none;
    border: none;
    font-size: 32px;
    cursor: pointer;
    line-height: 1;
}

.activity-title {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 40px;
    text-align: center;
}

.timer-display {
    width: 220px;
    height: 220px;
    background: #E8EEDF;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 32px;
    font-weight: 700;
    color: #1a1a1a;
    font-feature-settings: "tnum";
    margin-bottom: 40px;
}

.info-row {
    background: #E0E6D9; /* slightly darker pill */
    padding: 10px 20px;
    border-radius: 99px;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
    font-size: 14px;
}

.divider { color: #aaa; }
.points-val { font-weight: bold; }

.status-summary {
    background: #E0E6D9;
    padding: 10px 20px;
    border-radius: 99px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    margin-bottom: auto;
    width: fit-content;
}

.status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
}
.status-dot.pending { background-color: #3498db; }
.status-dot.active { background-color: #9b59b6; }

.actions {
    width: 100%;
    margin-bottom: 20px;
}

.btn-primary {
    width: 100%;
    padding: 18px;
    border-radius: 99px;
    font-size: 16px;
    font-weight: 600;
    border: none;
    cursor: pointer;
}

.btn-primary.start {
    background-color: #42b883;
    color: white;
}

.btn-primary.finish {
    background-color: #1a1a1a;
    color: white;
}
</style>
