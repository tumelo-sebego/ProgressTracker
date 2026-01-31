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

// Calculate real progress data for the chart
const chartData = computed(() => {
    if (!props.goal?.start_date || !props.activities) {
        return { labels: [], datasets: [] };
    }

    const start = new Date(props.goal.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const labels = [];
    const data = [];

    // Group activities by date
    const dailyStats = {};
    props.activities.forEach(act => {
        if (!act.date) return;
        if (!dailyStats[act.date]) {
            dailyStats[act.date] = { done: 0, total: 0 };
        }
        dailyStats[act.date].total++;
        if (act.status === 'done') {
            dailyStats[act.date].done++;
        }
    });

    // Populate data for each day from start to today
    let current = new Date(start);
    // Safety break to prevent infinite loops if dates are invalid
    let safetyCounter = 0; 
    while (current <= today && safetyCounter < 365) {
        const dateStr = current.toISOString().split('T')[0];
        const label = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        labels.push(label);
        
        const stats = dailyStats[dateStr];
        if (stats && stats.total > 0) {
            data.push(Math.round((stats.done / stats.total) * 100));
        } else {
            data.push(0); // OR null if you want a gap in the line
        }

        current.setDate(current.getDate() + 1);
        safetyCounter++;
    }

    return {
        labels,
        datasets: [
            {
                label: 'Completion Rate',
                backgroundColor: '#42b883',
                borderColor: '#42b883',
                data,
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
            grid: { color: '#f0f0f0' },
            ticks: {
                callback: (value) => value + '%'
            }
        },
        x: {
            grid: { display: false }
        }
    }
};

const coachMessage = computed(() => {
    const dataset = chartData.value.datasets?.[0];
    const progress = dataset?.data?.length > 0 ? dataset.data[dataset.data.length - 1] : 0; 
    
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
