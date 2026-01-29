<template>
  <div class="progress-view">
    <header>
        <h1>Stats</h1>
        <p>Track your momentum.</p>
    </header>

    <div class="content">
        <GoalAnalytics />
        
        <div class="stats-grid">
            <div class="stat-card">
                <span class="label">Total Points</span>
                <span class="value">1,240</span>
            </div>
            <div class="stat-card">
                <span class="label">Streak</span>
                <span class="value">5 Days</span>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import GoalAnalytics from '../components/GoalAnalytics.vue';
</script>

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
    background: #fff;
    padding: 20px;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}

.label {
    font-size: 14px;
    color: #888;
    margin-bottom: 8px;
}

.value {
    font-size: 24px;
    font-weight: 700;
    color: #1a1a1a;
}
</style>
