<template>
  <div class="login-container">
    <div class="card">
        <h1>Create Account</h1>
        
        <div class="input-group">
            <label>Name</label>
            <input v-model="name" type="text" placeholder="Your name" class="input-field" />
        </div>

        <div class="input-group">
            <label>Email</label>
            <input v-model="email" type="email" placeholder="Email address" class="input-field" />
        </div>

        <div class="input-group">
            <label>Password</label>
            <input v-model="password" type="password" placeholder="Password" class="input-field" />
        </div>

        <button @click="handleSignup" :disabled="!isFormValid" class="btn-primary">
            Sign Up
        </button>

        <p class="auth-link">
            Already have an account? <router-link to="/login">Login</router-link>
        </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const name = ref('');
const email = ref('');
const password = ref('');
const authStore = useAuthStore();
const router = useRouter();

const isFormValid = computed(() => {
    return name.value.trim() && email.value.trim() && password.value.length >= 6;
});

const handleSignup = async () => {
    if (isFormValid.value) {
        const success = await authStore.signup(name.value, email.value, password.value);
        if (success) {
            router.push('/welcome');
        } else {
            alert('Signup failed. Email might already be in use.');
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
}

.card {
    background: #F4F6F0;
    padding: 40px 30px;
    border-radius: 24px;
    width: 100%;
    max-width: 360px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
}

h1 {
    font-size: 28px;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0;
    margin-bottom: 10px;
}

.input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

label {
    font-size: 14px;
    font-weight: 600;
    color: #35495e;
}

.input-field {
    padding: 14px;
    border: none;
    background: #E8EEDF;
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
    border-radius: 99px;
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
