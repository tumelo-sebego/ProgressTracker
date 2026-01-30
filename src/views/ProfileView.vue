<template>
  <div class="profile-view">
    <header>
        <h1>Profile</h1>
        <p>Your journey so far.</p>
    </header>

    <div class="user-info">
        <div class="avatar-placeholder">{{ initials }}</div>
        <h2>{{ authStore.user?.name }}</h2>
    </div>

    <section class="past-goals">
        <h3>Past Goals</h3>
        <div class="goals-list">
             <div 
                v-for="goal in goals" 
                :key="goal.id" 
                class="goal-card"
                @click="viewGoal(goal.id)"
             >
                <div class="goal-info">
                    <span class="goal-title">{{ goal.title }}</span>
                    <span class="goal-date">{{ formatDate(goal.createdAt) }}</span>
                </div>
                <div class="goal-status">
                    <span class="status-badge" :class="goal.status">{{ goal.status }}</span>
                    <span class="arrow">→</span>
                </div>
             </div>
             <p v-if="goals.length === 0" class="empty-text">No past goals yet.</p>
        </div>
    </section>

    <button v-if="!hasActiveGoal" @click="startNewGoal" class="btn-start-goal">
        Start a new Goal
    </button>

    <button @click="logout" class="btn-logout">Log Out</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useRouter } from 'vue-router';
import { db } from '../db/schema';

const authStore = useAuthStore();
const router = useRouter();
const goals = ref([]);

const initials = computed(() => {
    const name = authStore.user?.name || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
});

const hasActiveGoal = computed(() => {
    return goals.value.some(g => g.status === 'active');
});

onMounted(async () => {
    // Ideally filter by user ID if we had multiple users
    goals.value = await db.goals.toArray();
});

const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
};

const viewGoal = (id) => {
    authStore.setViewingGoal(id);
    router.push('/');
};

const startNewGoal = () => {
    router.push('/onboarding/goal');
};

const logout = () => {
    authStore.logout();
    router.push('/login');
};
</script>

<style scoped>
.profile-view {
    padding: 24px;
    padding-bottom: 100px;
}

header h1 {
    margin: 0;
    font-size: 28px;
}

.user-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 40px 0;
}

.avatar-placeholder {
    width: 80px;
    height: 80px;
    background: #1a1a1a;
    color: #42b883;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 16px;
}

h2 { margin: 0; }

.past-goals h3 {
    font-size: 18px;
    margin-bottom: 16px;
}

.goals-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.goal-card {
    background: #fff;
    padding: 16px;
    border-radius: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    cursor: pointer;
    transition: transform 0.1s;
}

.goal-card:active { transform: scale(0.99); }

.goal-info {
    display: flex;
    flex-direction: column;
}

.goal-title {
    font-weight: 600;
    color: #1a1a1a;
}

.goal-date {
    font-size: 12px;
    color: #888;
}

.goal-status {
    display: flex;
    align-items: center;
    gap: 10px;
}

.status-badge {
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
    text-transform: uppercase;
    font-weight: 600;
}

.status-badge.active { background: #e3f2fd; color: #2196f3; }
.status-badge.done { background: #e8f5e9; color: #4caf50; }

.arrow { color: #ccc; }

.btn-logout {
    margin-top: 20px;
    background: #fdecea;
    color: #d32f2f;
    border: none;
    padding: 16px;
    width: 100%;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
}

.btn-start-goal {
    margin-top: 40px;
    background-color: var(--primary-color);
    color: var(--bg-color);
    border: none;
    padding: 20px;
    width: 100%;
    border-radius: 99px; /* Pill shape */
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.1s;
}

.btn-start-goal:active {
    transform: scale(0.98);
}
</style>
