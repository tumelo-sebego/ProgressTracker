import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import syncManager from './db/syncManager'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)
app.mount('#app')

// Initialize sync engine after app mounts (with error handling)
async function initializeSync() {
  try {
    // Only start sync if user is logged in (has auth token)
    if (localStorage.getItem('auth_token')) {
      console.log('🔄 Initializing sync engine...');
      
      // Start auto-sync (includes migration check and initial sync)
      await syncManager.startAutoSync();
      
      console.log('✅ Sync engine ready');
    } else {
      console.log('ℹ️ No auth token found. Sync will start after login.');
    }
  } catch (error) {
    console.error('❌ Sync initialization failed (app will still work offline):', error);
    // App continues even if sync fails - offline-first design
  }
}

// Call sync initialization
initializeSync();

