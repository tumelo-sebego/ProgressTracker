<template>
  <div class="login-container">
    <div class="card">
        <h1>Welcome Back</h1>
        
        <div class="input-group">
            <input v-model="email" type="email" placeholder="Email address" class="input-field" />
        </div>

        <div class="input-group">
            <input v-model="password" type="password" placeholder="Password" class="input-field" />
        </div>

        <button @click="handleLogin" :disabled="!isFormValid" class="btn-primary">
            Login
        </button>

        <p class="auth-link">
            New user? <router-link to="/signup">Sign Up</router-link>
        </p>

        <button v-if="isDev" @click="router.push('/onboarding/goal')" class="btn-secondary">
            View Onboarding (Dev Mode)
        </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const email = ref('');
const password = ref('');
const authStore = useAuthStore();
const router = useRouter();
const isDev = import.meta.env.DEV;

const isFormValid = computed(() => {
    return email.value.trim() && password.value.trim();
});

const handleLogin = async () => {
    if (isFormValid.value) {
        const success = await authStore.login(email.value, password.value);
        if (success) {
            router.push('/');
        } else {
            alert('Invalid email or password.');
        }
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
    background-color: var(--card-bg);
}

.card {
    padding: 40px 30px;
    border-radius: 24px;
    width: 100%;
    max-width: 360px;
    display: flex;
    flex-direction: column;
    gap: 30px;
}

h1 {
    font-size: 28px;
    font-weight: 700;
    color: var(--secondary-color);
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

label {
    font-size: 14px;
    font-weight: 600;
    color: #35495e;
}

.input-field {
    padding: 14px;
    border: none;
    background: #fff; /* Matching input bg */
    border-radius: 12px;
    font-size: 16px;
    color: var(--secondary-color);
    outline: none;
    transition: box-shadow 0.2s;
}

.input-field:focus {
    box-shadow: 0 0 0 2px #42b883;
}

.btn-primary {
    background-color: var(--primary-color);
    color: white;
    padding: 16px;
    border-radius: 99px; /* Pill shape */
    border: none;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.1s;
    margin-top: 10px;
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

.btn-secondary {
    background-color: transparent;
    color: var(--secondary-color);
    padding: 12px;
    border-radius: 99px;
    border: 1px solid var(--secondary-color);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 10px;
    opacity: 0.7;
}

.btn-secondary:hover {
    opacity: 1;
    background-color: rgba(0,0,0,0.05);
}

.auth-link {
    text-align: center;
    font-size: 14px;
    color: #35495e;
}

.auth-link a {
    color: #42b883;
    font-weight: 600;
    text-decoration: none;
}
</style>
