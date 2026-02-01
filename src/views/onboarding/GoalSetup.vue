<template>
  <div class="onboarding-container">
    <div class="card">
        <header>
            <button class="close-btn" @click="cancel">×</button>
            <span class="step-indicator">Add New <span class="highlight">Goal</span></span>
        </header>

        <div class="content">
            <div class="form-group">
                <label>What is the title of your goal?</label>
                <input v-model="title" type="text" class="input-field" placeholder="e.g. Healthy Living" />
            </div>

            <div class="form-group">
                <label>How many days will you be doing the Activities?</label>
                <div class="slider-container">
                    <input type="range" v-model="duration" min="1" max="30" class="custom-slider" />
                    <span class="slider-value">{{ duration }} Day{{ duration > 1 ? 's' : '' }}</span>
                </div>
            </div>

             <div class="form-group">
                <label>How many days in a week will you be doing the Activities?</label>
                <div class="slider-container">
                    <input type="range" v-model="weeklyFrequency" min="1" max="7" class="custom-slider" />
                    <span class="slider-value">{{ weeklyFrequency }} Day{{ weeklyFrequency > 1 ? 's' : '' }}</span>
                </div>
            </div>

            <div class="form-group">
                <label>When would you like to start?</label>
                <div class="select-wrapper">
                    <select v-model="startPreference" class="input-field">
                        <option value="Today">Today</option>
                        <option value="Tomorrow">Tomorrow</option>
                    </select>
                </div>
            </div>
        </div>

        <button @click="nextStep" :disabled="!title" class="btn-primary">Next</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

const title = ref(authStore.onboardingData.goal.title);
const duration = ref(authStore.onboardingData.goal.duration || 1);
const weeklyFrequency = ref(authStore.onboardingData.goal.frequency === 'Daily' ? 7 : 1);
const startPreference = ref(authStore.onboardingData.goal.startPreference || 'Today');

const cancel = () => {
    router.push('/');
};

const nextStep = () => {
    authStore.setGoalData({
        title: title.value,
        duration: parseInt(duration.value),
        frequency: weeklyFrequency.value === 7 ? 'Daily' : `${weeklyFrequency.value} Days/Week`,
        weeklyDays: parseInt(weeklyFrequency.value),
        startPreference: startPreference.value
    });
    router.push('/onboarding/activities');
};
</script>

<style scoped>
.onboarding-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}

.card {
     background: #F4F6F0;
    padding: 24px;
    border-radius: 24px;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    box-sizing: border-box;
}

header {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 40px;
    position: relative;
}

.close-btn {
    position: absolute;
    left: 0;
    background: none;
    border: none;
    font-size: 28px;
    cursor: pointer;
    padding: 0;
    line-height: 1;
}

.step-indicator {
    font-weight: 600;
    font-size: 14px;
    color: #1a1a1a;
}

.highlight {
    color: #42b883;
}

.content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 24px;
    overflow-y: auto;
    padding-bottom: 20px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

label {
    font-size: 14px;
    color: #1a1a1a;
    font-weight: 500;
}

.input-field {
    background-color: #E8EEDF;
    border: none;
    padding: 16px;
    border-radius: 12px;
    width: 100%;
    font-size: 16px;
    color: #1a1a1a;
    box-sizing: border-box; /* Fix padding issues */
}

/* Slider Styling */
.slider-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.custom-slider {
    -webkit-appearance: none;
    width: 100%;
    height: 4px; /* Thin line */
    background: #ccc;
    outline: none;
    border-radius: 2px;
    margin: 15px 0;
}

.custom-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: #42b883; /* Green dot */
    cursor: pointer;
    border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.custom-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: #42b883;
    cursor: pointer;
    border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.slider-value {
    font-size: 14px;
    font-weight: 600;
    color: #42b883;
}

/* Custom Select Styling */
.select-wrapper {
    position: relative;
}

.select-wrapper::after {
    content: '▼';
    font-size: 10px;
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
}

select.input-field {
    -webkit-appearance: none;
    appearance: none;
    cursor: pointer;
}

.btn-primary {
    background-color: #42b883; /* Green for Next */
    color: white;
    padding: 16px;
    border-radius: 99px;
    border: none;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 10px;
}

.btn-primary:active {
    transform: scale(0.98);
}
</style>
