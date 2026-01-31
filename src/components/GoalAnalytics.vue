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
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const props = defineProps({
  goal: Object,
  activities: Array
});

// Calculate progress data for the chart (Daily Points, Reverse Chronological)
const chartData = computed(() => {
    if (!props.activities) {
        return { labels: [], datasets: [] };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const labels = [];
    const pointsData = [];

    // Group points by date
    const dailyPoints = {};
    props.activities.forEach(act => {
        if (!act.date || act.status !== 'done') return;
        if (!dailyPoints[act.date]) {
            dailyPoints[act.date] = 0;
        }
        dailyPoints[act.date] += (act.points || 0);
    });

    // Populate data for the last 7 days (or until start_date) starting from Today
    const startLimit = props.goal?.start_date ? new Date(props.goal.start_date) : new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    startLimit.setHours(0, 0, 0, 0);

    let current = new Date(today);
    let safetyCounter = 0; 
    
    while (current >= startLimit && safetyCounter < 10) { // Limit to 10 days for UI clarity
        const dateStr = current.toISOString().split('T')[0];
        let label = "";
        
        if (safetyCounter === 0) {
            label = "Today";
        } else {
            label = current.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
        }
        
        labels.push(label);
        pointsData.push(dailyPoints[dateStr] || 0);

        current.setDate(current.getDate() - 1);
        safetyCounter++;
    }

    return {
        labels,
        datasets: [
            {
                label: 'Daily Points',
                backgroundColor: 'rgba(66, 184, 131, 0.2)',
                borderColor: '#42b883',
                borderWidth: 3,
                pointBackgroundColor: '#42b883',
                data: pointsData,
                tension: 0.4,
                fill: true
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
            min: 0,
            max: 100,
            grid: { color: '#f0f0f0' },
            ticks: {
                stepSize: 10,
                callback: (value) => value
            }
        },
        x: {
            grid: { display: false }
        }
    }
};

const coachMessage = computed(() => {
    const todayPoints = chartData.value.datasets?.[0]?.data?.[0] || 0;
    
    if (todayPoints >= 80) return { emoji: '🔥', text: 'You are on track!' };
    if (todayPoints >= 50) return { emoji: '👍', text: 'Keep pushing!' };
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
