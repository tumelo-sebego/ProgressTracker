<template>
  <div class="login-container">
    <div class="card">
        <h1>Ola, Tumelo</h1> <!-- Hardcoded as per design reference implied context, or dynamic -->
        <div class="welcome-message" v-if="!name">
            <p>You have no Goals currently setup.</p>
            <p><strong>Add a new Goal</strong> to get started.</p>
        </div>
        
        <div class="input-group">
            <label>What should we call you?</label>
            <input v-model="name" type="text" placeholder="Enter your name" class="input-field" />
        </div>

        <button @click="handleLogin" :disabled="!name" class="btn-primary">
            Start Journey
        </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const name = ref('');
const authStore = useAuthStore();
const router = useRouter();

const handleLogin = () => {
    if (name.value.trim()) {
        authStore.login(name.value);
        router.push('/onboarding/goal');
    }
};
</script>

<style scoped>
.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    padding: 20px;
}

.card {
    background: #F4F6F0; /* Light greenish/beige from design */
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

.input-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.input-field {
    padding: 14px;
    border: none;
    background: #E8EEDF; /* Matching input bg */
    border-radius: 12px;
    font-size: 16px;
    color: #1a1a1a;
    outline: none;
    transition: box-shadow 0.2s;
}

.input-field:focus {
    box-shadow: 0 0 0 2px #42b883;
}

.btn-primary {
    background-color: #1a1a1a;
    color: white;
    padding: 16px;
    border-radius: 99px; /* Pill shape */
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

.btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
