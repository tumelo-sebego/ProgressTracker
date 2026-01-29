<template>
  <div class="onboarding-container">
    <div class="card">
        <header>
            <button class="close-btn" @click="handleBack">
                {{ isAdding ? '×' : '←' }}
            </button>
            <span class="step-indicator">
                {{ isAdding ? 'New' : 'Add New' }} <span class="highlight">{{ isAdding ? 'Activity' : 'Activities' }}</span>
            </span>
        </header>

        <!-- MAIN LIST VIEW -->
        <div v-if="!isAdding" class="view-container">
            <!-- Info/Status Box -->
            <div class="status-box" :class="{ 'success': pointsRemaining === 0 }">
                <p v-if="activities.length === 0">Add Activities to repeatedly do everyday to cultivate a habit.</p>
                <p v-else>
                    Points remaining: <strong>{{ pointsRemaining }}</strong>
                    <span v-if="pointsRemaining !== 0" class="warning-text"><br>Must be 0 to continue</span>
                </p>
            </div>

            <div class="content list-content">
                <div class="activity-list">
                    <div v-for="(activity, index) in activities" :key="index" class="activity-item">
                        <span class="act-name">{{ activity.title }}</span>
                        <span class="act-points">{{ activity.points }}%</span>
                        <button class="remove-btn" @click="removeActivity(index)">×</button>
                    </div>
                </div>
            </div>

            <div class="action-area">
                <button v-if="pointsRemaining === 0" @click="finish" class="btn-primary">
                    Confirm Goal
                </button>
                <button v-else @click="isAdding = true" class="btn-primary">
                    Add Activity
                </button>
            </div>
        </div>

        <!-- ADD ACTIVITY FORM VIEW -->
        <div v-else class="view-container">
            <div class="content form-content">
                 <div class="form-group">
                    <label>Name of the Activity</label>
                    <input v-model="newActivityName" class="input-field" placeholder="e.g. Go for a walk" />
                </div>

                <div class="form-group">
                    <label>Activity Points</label>
                    <input v-model.number="newActivityPoints" type="number" class="input-field" placeholder="e.g. 10" />
                </div>
            </div>

            <div class="action-area">
                <button @click="handleAdd" class="btn-primary" :disabled="!isValidActivity">
                    Done
                </button>
            </div>
        </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

const isAdding = ref(false); // Toggle between List and Add Form
const newActivityName = ref('');
const newActivityPoints = ref('');

const activities = computed(() => authStore.onboardingData.activities);
const currentPoints = computed(() => {
    return activities.value.reduce((sum, item) => sum + item.points, 0);
});
const pointsRemaining = computed(() => 100 - currentPoints.value);

const isValidActivity = computed(() => {
    return newActivityName.value && 
           newActivityPoints.value > 0 && 
           newActivityPoints.value <= pointsRemaining.value;
});

const handleBack = () => {
    if (isAdding.value) {
        isAdding.value = false;
        // Reset form
        newActivityName.value = '';
        newActivityPoints.value = '';
    } else {
        router.back();
    }
};

const handleAdd = () => {
    if (isValidActivity.value) {
        authStore.addActivity({
            title: newActivityName.value,
            points: newActivityPoints.value
        });
        // Go back to list
        isAdding.value = false;
        newActivityName.value = '';
        newActivityPoints.value = '';
    } else if (newActivityPoints.value > pointsRemaining.value) {
         alert(`You only have ${pointsRemaining.value} points left!`);
    }
};

const removeActivity = (index) => {
    authStore.removeActivity(index);
};

const finish = async () => {
    if (pointsRemaining.value === 0) {
       const success = await authStore.finishOnboarding();
       if (success) {
           router.push('/');
       }
    }
};
</script>

<style scoped>
.onboarding-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    padding: 20px;
}

.card {
     background: #F4F6F0;
    padding: 24px;
    border-radius: 24px;
    width: 100%;
    max-width: 360px;
    height: 600px;
    display: flex;
    flex-direction: column;
}

header {
    display: flex;
    align-items: center;
    position: relative;
    margin-bottom: 20px;
    justify-content: center;
    min-height: 40px;
}

.close-btn {
    position: absolute;
    left: 0;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    line-height: 1;
}

.step-indicator {
    font-weight: 600;
    font-size: 14px;
}

.highlight { color: #42b883; }

.view-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden; /* Contain inner scrolling */
}

.status-box {
    background-color: #E8EEDF;
    padding: 15px;
    border-radius: 12px;
    font-size: 14px;
    color: #35495e;
    margin-bottom: 20px;
}

.status-box.success {
    background-color: #dff0d8;
    color: #3c763d;
}

.warning-text {
    color: #d9534f;
    font-size: 12px;
}

.content {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

.list-content {
    gap: 10px;
    padding-bottom: 10px;
}

.form-content {
    gap: 24px;
    padding-top: 20px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.form-group label {
    font-size: 14px;
    font-weight: 500;
    color: #1a1a1a;
}

.input-field {
    background-color: #E8EEDF;
    border: none;
    padding: 16px;
    border-radius: 12px;
    width: 100%;
    font-size: 16px;
    color: #1a1a1a;
    box-sizing: border-box;
}

.activity-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.activity-item {
    background: #E8EEDF;
    padding: 12px;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
}

.act-points {
    font-weight: bold;
    margin-left: auto;
    margin-right: 10px;
}

.remove-btn {
    background: #ddd;
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
}

.action-area {
    margin-top: 20px;
}

.btn-primary {
    background-color: #42b883;
    color: white;
    padding: 16px;
    border-radius: 99px;
    border: none;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
}

.btn-primary:active { transform: scale(0.98); }

.btn-primary:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}
</style>
