<template>
  <div class="analytics-card">
    <div class="chart-container">
        <Line :data="chartData" :options="chartOptions" />
    </div>

    <div class="coach-pill">
        <span class="emoji">{{ coachMessage.emoji }}</span>
        <span>{{ coachMessage.text }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const props = defineProps({
  goal: Object,
  activities: Array
});

// Mocking data for visual demonstration since we don't have historical daily logs in this simple schema yet
// In a real app, we'd query a 'daily_logs' table.
const chartData = computed(() => {
    return {
        labels: ['Day 1', 'Day 5', 'Day 10', 'Day 15', 'Day 20', 'Today'],
        datasets: [
            {
                label: 'Completion Rate',
                backgroundColor: '#42b883',
                borderColor: '#42b883',
                data: [0, 20, 45, 60, 75, 84], // Mock data
                tension: 0.4
            }
        ]
    };
});

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false }
    },
    scales: {
        y: {
            beginAtZero: true,
            max: 100,
            grid: { color: '#f0f0f0' }
        },
        x: {
            grid: { display: false }
        }
    }
};

const coachMessage = computed(() => {
    // Simple logic based on mock current progress
    const progress = 84; 
    if (progress >= 80) return { emoji: '🔥', text: 'You are on track!' };
    if (progress >= 50) return { emoji: '👍', text: 'Keep pushing!' };
    return { emoji: '🌱', text: 'Just getting started.' };
});
</script>

<style scoped>
.analytics-card {
    border-radius: 20px;
    padding: 24px;
}

.coach-pill {
    background: #E6E7E9;
    color: #1a1a1a;
    padding: 18px 24px;
    border-radius: 99px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-size: 15px;
    font-weight: 700;
    margin-top: 24px;
    width: 100%;
    box-sizing: border-box;
}

.chart-container {
    height: 200px;
    width: 100%;
}
</style>
