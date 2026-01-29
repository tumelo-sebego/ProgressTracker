<template>
  <div class="home-view">
    <ArchiveBanner v-if="authStore.viewingGoalId" @exit="exitArchive" />

    <div class="header" :class="{ 'has-banner': authStore.viewingGoalId }">
        <h1>Ola, {{ userName }}</h1>
        <p class="date">{{ currentDate }}</p>
    </div>

    <div class="progress-section">
        <CircularProgress 
            :percentage="progressPercentage" 
            :size="260" 
            :stroke-width="20"
        />
    </div>

    <div class="activities-section">
        <ActivityCard
            v-for="activity in activities"
            :key="activity.id"
            :title="activity.title"
            :points="activity.points"
            :status="activity.status"
            :disabled="isInteractionDisabled(activity)"
            @click="openActivity(activity)"
        />
    </div>

    <ActivityTimerDialog
        v-if="selectedActivity"
        :activity="selectedActivity"
        :start-time="selectedActivity.startTime"
        @close="closeDialog"
        @start="startActivity"
        @finish="finishActivity"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '../stores/authStore';
import CircularProgress from '../components/CircularProgress.vue';
import ActivityCard from '../components/ActivityCard.vue';
import ActivityTimerDialog from '../components/ActivityTimerDialog.vue';
import ArchiveBanner from '../components/ArchiveBanner.vue';
import { db } from '../db/schema';
import { liveQuery } from 'dexie';

const authStore = useAuthStore();
const userName = computed(() => authStore.user?.name?.split(' ')[0] || 'User'); 

const currentDate = computed(() => {
    const options = { weekday: 'short', day: 'numeric', month: 'long' };
    return new Date().toLocaleDateString('en-US', options);
});

const activities = ref([]);
const selectedActivity = ref(null);

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
    if (authStore.viewingGoalId) {
        // Fetch activities for the SPECIFIC goal being viewed
        return await db.activities.where('goalId').equals(authStore.viewingGoalId).toArray();
    } else {
        // Fetch current active goal activities (Simplified logic: grab the 'active' goal, then its activities)
        // For MVP simplicity, we just grab ALL activities if no specific goal is viewed 
        // OR we grab the latest active goal (better).
        const activeGoal = await db.goals.where('status').equals('active').last();
        if (activeGoal) {
             return await db.activities.where('goalId').equals(activeGoal.id).toArray();
        }
        return [];
    }
}).subscribe({
    next: result => {
        activities.value = result;
    },
    error: error => console.error(error)
});

const isInteractionDisabled = (activity) => {
    // Disable ALL if viewing past goal
    if (authStore.viewingGoalId) return true;
    
    // Original Focus Rule
    return currentActiveId.value !== null && currentActiveId.value !== activity.id;
};

const openActivity = (activity) => {
    if (authStore.viewingGoalId) return; // No interaction in archive mode

    if (!currentActiveId.value || currentActiveId.value === activity.id) {
         selectedActivity.value = activity;
    }
};

const closeDialog = () => {
    selectedActivity.value = null;
};

const startActivity = async (id) => {
    await db.activities.update(id, { 
        status: 'active',
        startTime: Date.now() 
    });
    const updated = await db.activities.get(id);
    selectedActivity.value = updated;
};

const finishActivity = async (id) => {
    await db.activities.update(id, { 
        status: 'done',
        startTime: null 
    });
    selectedActivity.value = null; 
};

const exitArchive = () => {
    authStore.clearViewingGoal();
};

</script>

<style scoped>
.home-view {
    padding: 24px;
    padding-bottom: 100px; /* Space for Navbar */
    min-height: 100vh;
    box-sizing: border-box;
    padding-top: 24px; /* Reset default */
}

.header.has-banner {
    margin-top: 40px; /* Push down for banner */
}

.header {
    margin-bottom: 30px;
}

h1 {
    font-size: 28px;
    margin: 0;
    color: #1a1a1a;
}

.date {
    color: #555;
    font-weight: 500;
    margin-top: 4px;
}

.progress-section {
    display: flex;
    justify-content: center;
    margin-bottom: 40px;
}

.activities-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
</style>
