<template>
  <div class="home-view">
    <ArchiveBanner v-if="authStore.viewingGoalId" @exit="exitArchive" />

    <div class="header" :class="{ 'has-banner': authStore.viewingGoalId }">
        <h1>Ola, {{ userName }}</h1>
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

const formattedDate = computed(() => {
    const date = new Date();
    const w = date.toLocaleDateString('en-GB', { weekday: 'short' });
    const d = date.getDate();
    const m = date.toLocaleDateString('en-GB', { month: 'long' });
    return `${w}. ${d} ${m}`;
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
        return await db.activities.where('goalId').equals(authStore.viewingGoalId).toArray();
    } else {
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
    if (authStore.viewingGoalId) return true;
    return currentActiveId.value !== null && currentActiveId.value !== activity.id;
};

const openActivity = (activity) => {
    if (authStore.viewingGoalId) return; 

    if (!currentActiveId.value || currentActiveId.value === activity.id) {
         selectedActivity.value = activity;
    }
};

const closeDialog = () => {
    selectedActivity.value = null;
};

const startActivity = async (id) => {
    const now = Date.now();
    await db.activities.update(id, { 
        status: 'active',
        startTime: now,
        startedAt: now // Persist start time for history
    });
    const updated = await db.activities.get(id);
    selectedActivity.value = updated;
};

const finishActivity = async (id) => {
    const activity = activities.value.find(a => a.id === id);
    let durationVal = 0;
    const now = Date.now();
    
    if (activity && activity.startTime) {
        const diff = now - activity.startTime;
        durationVal = Math.round(diff / 60000); // Minutes
        if (durationVal < 1) durationVal = 1; // Minimum 1 min
    } else {
        durationVal = activity.points || 0; 
    }

    await db.activities.update(id, { 
        status: 'done',
        startTime: null, // Clear active timer
        completedAt: now, // Persist completion time
        duration: durationVal
    });
    // Update selectedActivity to close dialog with correct state or null?
    // User flow: "when an Activity has been completed... there's another row that should appear...".
    // Does the dialog CLOSE or stay OPEN? 
    // Usually clicking "Finish" closes it. 
    // BUT the user says: "in a done state, there's another row that should appear...". 
    // This implies they can VIEW the dialog for a DONE activity.
    // So we should Update local state, then let user close it.
    
    // selectedActivity.value = null; // Don't nullify immediately if we want to show 'Done' state in dialog?
    // Wait, usually flow is Finish -> Close. User can re-open from Home list.
    // If I close it, they can reopen it to see the "Done" state.
    // Let's close it for now as per previous logic, but ensure 'completedAt' is saved.
    
    selectedActivity.value = null; 
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
