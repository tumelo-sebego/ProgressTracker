<template>
  <div class="home-view">
    <ArchiveBanner v-if="authStore.viewingGoalId" @exit="exitArchive" />

    <div class="header" :class="{ 'has-banner': authStore.viewingGoalId }">
        <h1>Ola {{ userName }}</h1>
        <p class="date">{{ formattedDate }}</p>
    </div>

    <div v-if="!hasStarted" class="countdown-section">
        <div class="countdown-card">
            <h2>Your journey begins in...</h2>
            <div class="timer">
                {{ countdownTime }}
            </div>
            <p>Get ready for a fresh start!</p>
        </div>
    </div>

    <div v-else-if="isRestDay" class="countdown-section">
        <div class="countdown-card rest-card">
            <h2>Time to Recharge</h2>
            <div class="timer">
                {{ countdownTime }}
            </div>
            <p>You've earned your rest! Your next session starts in...</p>
        </div>
    </div>

    <template v-else>
        <div class="progress-section">
            <CircularProgress 
                :percentage="progressPercentage" 
                :size="260" 
                :stroke-width="20"
                color="#52a65b" 
                bgColor="#1a1a1a"
            />
        </div>

        <div class="activities-section">
            <ActivityCard
                v-for="activity in sortedActivities"
                :key="activity.id"
                :title="activity.title"
                :points="activity.points"
                :duration="activity.duration"
                :status="activity.status"
                :disabled="isInteractionDisabled(activity)"
                @click="openActivity(activity)"
            />
        </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useActivityStore } from '../stores/activityStore';
import CircularProgress from '../components/CircularProgress.vue';
import ActivityCard from '../components/ActivityCard.vue';
import ArchiveBanner from '../components/ArchiveBanner.vue';
import { db } from '../db/schema';
import { liveQuery } from 'dexie';

const authStore = useAuthStore();
const activityStore = useActivityStore(); // Global store
const userName = computed(() => authStore.user?.name?.split(' ')[0] || 'User'); 

const formattedDate = computed(() => {
    const date = new Date();
    const w = date.toLocaleDateString('en-GB', { weekday: 'short' });
    const d = date.getDate();
    const m = date.toLocaleDateString('en-GB', { month: 'long' });
    return `${w}. ${d} ${m}`;
});

const activities = ref([]);
const todayDate = new Date().toISOString().split('T')[0];

// We can still compute active ID for enabling/disabling if needed
const currentActiveId = computed(() => {
    const active = activities.value.find(a => a.status === 'active');
    return active ? active.id : null;
});

const progressPercentage = computed(() => {
    if (activities.value.length === 0) return 0;
    const totalPoints = activities.value.reduce((sum, item) => sum + item.points, 0);
    const donePoints = activities.value
        .filter(item => item.status === 'done')
        .reduce((sum, item) => sum + item.points, 0);
    
    return totalPoints === 0 ? 0 : Math.round((donePoints / totalPoints) * 100);
});

const sortedActivities = computed(() => {
    const statusOrder = { 'active': 0, 'pending': 1, 'done': 2 };
    
    return [...activities.value].sort((a, b) => {
        // First sort by status order
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];
        if (statusDiff !== 0) return statusDiff;
        
        // If both are 'done', sort by end_time in reverse (most recent first)
        if (a.status === 'done') {
            const timeA = a.end_time || 0;
            const timeB = b.end_time || 0;
            return timeB - timeA;
        }
        
        return 0; // Maintain relative order for same status (pending/active)
    });
});

const hasStarted = ref(true);
const isRestDay = ref(false);
const countdownTime = ref('00:00:00');
let countdownInterval = null;

const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatGoalDate = (dateStr) => {
    const date = new Date(dateStr);
    const weekday = date.toLocaleDateString('en-GB', { weekday: 'short' });
    const day = date.getDate();
    const month = date.toLocaleDateString('en-GB', { month: 'short' });
    
    const getOrdinal = (n) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    
    return `${weekday} ${getOrdinal(day)} ${month}`;
};

// Live Data Query
const subscription = liveQuery(async () => {
    if (!authStore.user) return [];

    const activeGoal = await db.goals
        .where('[userId+status]')
        .equals([authStore.user.id, 'active'])
        .first();

    if (activeGoal) {
        const todayDateStr = getLocalDateString(new Date());
        const start = new Date(activeGoal.start_date);
        const today = new Date(todayDateStr);
        const diffInTime = today.getTime() - start.getTime();
        const diffInDays = Math.floor(diffInTime / (1000 * 3600 * 24));

        if (diffInDays < 0) {
            hasStarted.value = false;
            isRestDay.value = false;
            startCountdown(activeGoal.start_date);
        } else {
            hasStarted.value = true;
            const dayInCycle = diffInDays % 7;
            const weeklyDays = activeGoal.weeklyDays || 7;
            
            if (dayInCycle >= weeklyDays) {
                isRestDay.value = true;
                // Next week starts at start_date + (weekIndex + 1) * 7
                const weekIndex = Math.floor(diffInDays / 7);
                const nextStart = new Date(start);
                nextStart.setDate(start.getDate() + (weekIndex + 1) * 7);
                startCountdown(nextStart.toISOString().split('T')[0]);
            } else {
                isRestDay.value = false;
                if (countdownInterval) clearInterval(countdownInterval);
            }
        }
    }

    if (authStore.viewingGoalId) {
        return await db.activities
            .where('goalId').equals(authStore.viewingGoalId)
            .toArray();
    } else {
        if (activeGoal) {
             return await db.activities
                .where('[userId+goalId+date]')
                .equals([authStore.user.id, activeGoal.id, todayDate])
                .toArray();
        }
        return [];
    }
}).subscribe({
    next: result => {
        activities.value = result;
    },
    error: error => console.error(error)
});

const startCountdown = (startDateStr) => {
    if (countdownInterval) clearInterval(countdownInterval);
    
    const updateCountdown = () => {
        const now = new Date();
        const start = new Date(startDateStr);
        start.setHours(0, 0, 0, 0);
        
        const diff = start - now;
        
        if (diff <= 0) {
            hasStarted.value = true;
            clearInterval(countdownInterval);
            return;
        }

        // If more than 24 hours away, show formatted date
        if (diff > 24 * 3600 * 1000) {
            countdownTime.value = formatGoalDate(startDateStr);
            return;
        }
        
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        countdownTime.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
    
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
};

onMounted(async () => {
    await activityStore.checkAndResetDaily();
});

onUnmounted(() => {
    if (countdownInterval) clearInterval(countdownInterval);
});

const isInteractionDisabled = (activity) => {
    return false;
};

const openActivity = (activity) => {
    activityStore.openActivity(activity);
};

const exitArchive = () => {
    authStore.clearViewingGoal();
};

</script>

<style scoped>
.home-view {
    padding: 24px;
    padding-bottom: 120px; /* Space for Navbar */
    min-height: 100vh;
    box-sizing: border-box;
    padding-top: 24px;
    background-color: #f8faed;
}

.header.has-banner {
    margin-top: 40px; 
}

.header {
    margin-bottom: 30px;
}

h1 {
    font-size: 32px; /* Larger title */
    font-weight: 700;
    margin: 0;
    color: #1a1a1a;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
}

.date {
    color: #1a1a1a;
    font-size: 16px;
    font-weight: 700; /* Bold date */
    margin: 0;
    letter-spacing: 0.5px;
}

.progress-section {
    display: flex;
    justify-content: center;
    margin-bottom: 40px;
    margin-top: 20px;
}

.activities-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

/* Countdown Styles */
.countdown-section {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
    padding: 20px;
    margin-top: -40px; /* Center it better visually */
}

.countdown-card {
    padding: 40px;
    border-radius: 32px;
    text-align: center;
    width: 100%;
}

.countdown-card.rest-card {
    background: #E8F4F8; /* Subtle blue for rest */
}

.countdown-card h2 {
    font-size: 18px;
    color: #666;
    font-weight: 500;
    margin-bottom: 20px;
}

.timer {
    font-size: 48px;
    font-weight: 800;
    color: var(--primary-text-color);
    font-feature-settings: "tnum";
    margin: 20px 0;
    letter-spacing: -1px;
}

.countdown-card p {
    color: #888;
    font-size: 14px;
    margin: 0;
}
</style>
