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

const props = defineProps({
  activity: Object,
  startTime: Number // If passed, implies it's already running
});

const emit = defineEmits(['close', 'start', 'finish']);

const timerInterval = ref(null);
const elapsedSeconds = ref(0);
const isActive = ref(false);

const isDone = computed(() => props.activity.status === 'done');

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
    // If done, show duration from prop or calculated? 
    // If done, timer usually static or hidden? Design shows timer in done state?
    // Image shows 00:15:25 on a DONE card? Or active?
    // Actually the image "20min Meditation" has a timer "00:15:25" and status "Done" at bottom?
    // Wait, the status summary says "Done" in the green pill.
    // So YES, show final timer value.
    
    let seconds = elapsedSeconds.value;
    if (isDone.value && props.activity.duration) {
         // If duration is in minutes, convert to seconds? 
         // But we assume precision? Or just show duration.
         // Actually if we just finished, we have seconds.
         // If re-opened, we might only have minutes (duration).
         // Let's rely on props.activity.duration (min) * 60 if clean load.
         if (seconds === 0) seconds = props.activity.duration * 60; 
    }

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});

const formattedDate = computed(() => {
    if (!props.activity.completedAt) return 'Today'; // Fallback
    const date = new Date(props.activity.completedAt);
    const d = date.getDate();
    const m = date.toLocaleDateString('en-GB', { month: 'long' });
    
    // Suffix logic (st, nd, rd, th)
    const j = d % 10,
        k = d % 100;
    let suffix = "th";
    if (j == 1 && k != 11) suffix = "st";
    else if (j == 2 && k != 12) suffix = "nd";
    else if (j == 3 && k != 13) suffix = "rd";
    
    return `${d}${suffix} ${m}`;
});

const formattedTimeRange = computed(() => {
    if (!props.activity.startedAt || !props.activity.completedAt) return '00:00 - 00:00';
    
    const format = (ts) => {
        const d = new Date(ts);
        return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    };
    
    return `${format(props.activity.startedAt)} - ${format(props.activity.completedAt)}`; 
});

const startTimerTick = () => {
    timerInterval.value = setInterval(() => {
        elapsedSeconds.value++;
    }, 1000);
};

onMounted(() => {
    if (props.startTime) {
        isActive.value = true;
        const now = Date.now();
        elapsedSeconds.value = Math.floor((now - props.startTime) / 1000);
        startTimerTick();
    } else if (isDone.value && props.activity.duration) {
        // Init elapsed seconds for display
        elapsedSeconds.value = props.activity.duration * 60; 
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
    // Local update to done state immediately? 
    // Parent handles DB update which triggers reactivity if using liveQuery?
    // But selectedActivity might be a detached object reference or updated by parent.
    // Parent wrapper does: selectedActivity.value = updated.
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
    align-items: center; /* Center horizontally and vertically */
    z-index: 1000;
}

.dialog {
    background: #f8faed;
    width: calc(100% - 32px); /* Fill screen with margin */
    height: calc(100% - 64px); /* Vertical margin */
    max-width: 480px; /* Max constraint */
    max-height: 800px;
    border-radius: 40px; /* Larger radius as per image */
    padding: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
    position: relative;
    /* animation: slideUp 0.3s ease-out;  Maybe fade/scale is better for center card */
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
    font-size: 36px;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    color: #1a1a1a;
}

.activity-title {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 60px; /* More space */
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
    font-size: 42px; /* Bigger font */
    font-weight: 700;
    color: #1a1a1a;
    font-feature-settings: "tnum";
    margin-bottom: auto; /* Push content down? Or space evenly? */
}

/* Push details to bottom */
.info-row {
    background: var(--bg-color); /* Matches page/requested bg - actually user said bg of button is primary... wait. "background color of all row classes is --bg-color" - Done. */
    /* Wait, checking user request: "bg of all row classes is --bg-color" (from prev PROMPT). 
       Current PROMPT: "bg of the button is --primary-color, when clicked its bg changes to --text-color" */
    
    background: #eaeed3; /* Using secondary darker shade for rows as seen in image? 
                          User said "--bg-color" in prev prompt. 
                          Let's stick to what looks like the image: Greyish pill. #eaeed3 is standard card bg. 
                          The image has greyish rows. #e6e7e9 was set as bg-color by user in Step 76.
                          So var(--bg-color) is correct. */
    background-color: #E6E7E9; /* Explicitly ensure it matches if var is used */
    
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
    color: #1a1a1a; /* Darker divider */
    font-weight: 300;
    font-size: 20px;
    opacity: 0.3;
    margin: 0 8px; /* More space around line */
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
    color: #5BA874; /* Text color green if done? Image shows "Done" in Green Text with Green Dot? */
}

.status-summary .info-left {
    color: inherit;
}

/* Status dots */
.status-dot {
    width: 18px; /* Bigger dot */
    height: 18px;
    border-radius: 50%;
    display: inline-block;
}
.status-dot.pending { background-color: #3498db; }
.status-dot.active { background-color: #9b59b6; }
.status-dot.done { 
    background-color: var(--primary-color); 
}

/* Button */
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
    /* Default Primary */
    background-color: var(--primary-color);
    color: #fff; /* White text on green button? */
}

.btn-primary:active, .btn-primary:focus {
    background-color: var(--text-color); /* Change to text color (dark) on click */
}

/* Close action style (if viewing done) */
.btn-primary.close-action {
    background-color: var(--text-color); /* Maybe dark for close? */
}
</style>
