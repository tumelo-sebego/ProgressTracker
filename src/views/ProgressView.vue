<script setup>
import { ref, computed, onMounted } from 'vue';
import GoalAnalytics from '../components/GoalAnalytics.vue';
import { db } from '../db/schema';
import { liveQuery } from 'dexie';

const activeGoal = ref(null);
const allGoalActivities = ref([]);

const subscription = liveQuery(async () => {
    const goal = await db.goals.where('status').equals('active').last();
    if (goal) {
        const activities = await db.activities.where('goalId').equals(goal.id).toArray();
        return { goal, activities };
    }
    return null;
}).subscribe(result => {
    if (result) {
        activeGoal.value = result.goal;
        allGoalActivities.value = result.activities;
    }
});

const accumulatedPoints = computed(() => {
    return allGoalActivities.value
        .filter(a => a.status === 'done')
        .reduce((sum, item) => sum + (item.points || 0), 0);
});

const totalPointsTarget = computed(() => {
    if (!activeGoal.value) return 0;
    // Assuming each day has a pool of 100 points
    return activeGoal.value.duration * 100;
});

const formattedPoints = computed(() => {
    const target = totalPointsTarget.value.toLocaleString();
    return `${accumulatedPoints.value}/${target}`;
});

const daysLeft = computed(() => {
    if (!activeGoal.value?.end_date) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(activeGoal.value.end_date);
    end.setHours(0, 0, 0, 0);
    const diffTime = end - today;
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
});
</script>

<template>
  <div class="progress-view">
    <header>
        <h1>Stats</h1>
        <p>Your Progress so far</p>
    </header>

    <div class="content" v-if="activeGoal">
        <GoalAnalytics :goal="activeGoal" :activities="allGoalActivities" />
        
        <div class="stats-grid">
            <div class="stat-card">
                <span class="label">Total Points</span>
                <span class="value">{{ formattedPoints }}</span>
            </div>
            <div class="stat-card">
                <span class="label">Next Milestone</span>
                <span class="value">{{ daysLeft }} Days left</span>
            </div>
        </div>
    </div>
    <div v-else class="empty-state">
        <p>No active goal to track.</p>
    </div>
  </div>
</template>

<style scoped>
.progress-view {
    padding: 24px;
    padding-bottom: 100px;
}

header { margin-bottom: 30px; }
header h1 { margin: 0; font-size: 28px; }

.content {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.stat-card {
    background: var(--primary-color);
    padding: 20px;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}

.label {
    font-size: 14px;
    color: #fff;
    margin-bottom: 8px;
}

.value {
    font-size: 18px;
    font-weight: 700;
    color: #fff;
}
</style>
