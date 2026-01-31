<template>
  <div class="welcome-container">
    <div class="card">
        <h1>Ola, {{ firstName }}</h1>
        <div class="welcome-message">
            <p>You have no Goals currently setup.</p>
            <p><strong>Add a new Goal</strong> to get started.</p>
        </div>
        
        <button @click="startJourney" class="btn-primary">
            Start Journey
        </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const authStore = useAuthStore();
const router = useRouter();

const firstName = computed(() => {
    return authStore.user?.name?.split(' ')[0] || 'User';
});

const startJourney = () => {
    router.push('/onboarding/goal');
};
</script>

<style scoped>
.welcome-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    padding: 20px;
}

.card {
    background: #F4F6F0;
    padding: 40px 30px;
    border-radius: 24px;
    width: 100%;
    max-width: 360px;
    display: flex;
    flex-direction: column;
    gap: 30px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
}

h1 {
    font-size: 28px;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0;
}

.welcome-message {
    background-color: #E8EEDF;
    padding: 15px;
    border-radius: 12px;
    font-size: 14px;
    color: #35495e;
    line-height: 1.5;
}

.btn-primary {
    background-color: #1a1a1a;
    color: white;
    padding: 16px;
    border-radius: 99px;
    border: none;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.1s;
    margin-top: auto;
    display: flex;
    justify-content: center;
    align-items: center;
}

.btn-primary:active {
    transform: scale(0.98);
}
</style>
