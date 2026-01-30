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
                <div class="select-wrapper">
                    <select v-model="duration" class="input-field">
                        <option v-for="n in 30" :key="n" :value="n">{{ n }} Day{{ n > 1 ? 's' : '' }}</option>
                    </select>
                </div>
            </div>

             <div class="form-group">
                <label>How many days in a week will you be doing the Activities?</label>
                <div class="select-wrapper">
                    <select v-model="frequency" class="input-field">
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Weekdays">Weekdays</option>
                        <option value="Weekends">Weekends</option>
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
const duration = ref(authStore.onboardingData.goal.duration);
const frequency = ref(authStore.onboardingData.goal.frequency);

const cancel = () => {
    router.push('/');
};

const nextStep = () => {
    authStore.setGoalData({
        title: title.value,
        duration: duration.value,
        frequency: frequency.value
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
    gap: 30px;
    overflow-y: auto;
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
    margin-top: 20px;
}

.btn-primary:active {
    transform: scale(0.98);
}
</style>
