<template>
  <div class="home-view">
    <ArchiveBanner v-if="authStore.viewingGoalId" @exit="exitArchive" />

    <div class="header" :class="{ 'has-banner': authStore.viewingGoalId }">
        <h1>Ola {{ userName }}</h1>
        <p class="date">{{ formattedDate }}</p>
    </div>

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
            v-for="activity in activities"
            :key="activity.id"
            :title="activity.title"
            :points="activity.points"
            :duration="activity.duration"
            :status="activity.status"
            :disabled="isInteractionDisabled(activity)"
            @click="openActivity(activity)"
        />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
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

// Live Data Query
const subscription = liveQuery(async () => {
    if (!authStore.user) return [];

    if (authStore.viewingGoalId) {
        return await db.activities
            .where('goalId').equals(authStore.viewingGoalId)
            .toArray();
    } else {
        const activeGoal = await db.goals
            .where('[userId+status]')
            .equals([authStore.user.id, 'active'])
            .first();

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

onMounted(async () => {
    await activityStore.checkAndResetDaily();
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
</style>
