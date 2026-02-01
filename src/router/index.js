import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProgressView from '../views/ProgressView.vue'
import ProfileView from '../views/ProfileView.vue'
import LoginView from '../views/LoginView.vue'
import SignupView from '../views/SignupView.vue'
import WelcomeView from '../views/WelcomeView.vue'
import GoalSetup from '../views/onboarding/GoalSetup.vue'
import ActivityBuilder from '../views/onboarding/ActivityBuilder.vue'
import { useAuthStore } from '../stores/authStore'
import { db } from '../db/schema'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true }
    },
    {
      path: '/progress',
      name: 'progress',
      component: ProgressView,
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { hideNavbar: true }
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignupView,
      meta: { hideNavbar: true }
    },
    {
      path: '/welcome',
      name: 'welcome',
      component: WelcomeView,
      meta: { requiresAuth: true, hideNavbar: true }
    },
    {
      path: '/onboarding/goal',
      name: 'goal-setup',
      component: GoalSetup,
      meta: { requiresAuth: true, hideNavbar: true }
    },
    {
      path: '/onboarding/activities',
      name: 'activity-builder',
      component: ActivityBuilder,
      meta: { requiresAuth: true, hideNavbar: true }
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  if (to.meta.requiresAuth && !authStore.user && !to.path.startsWith('/onboarding')) {
    next('/login');
  } else if ((to.path === '/login' || to.path === '/signup') && authStore.user) {
    next('/');
  } else if (to.path === '/' && authStore.user) {
    const activeGoal = await db.goals
      .where('[userId+status]')
      .equals([authStore.user.id, 'active'])
      .first();
    if (!activeGoal) {
      next('/welcome');
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router
