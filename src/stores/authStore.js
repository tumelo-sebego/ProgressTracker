import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '../db/schema';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user')) || null);
  const onboardingData = ref({
    goal: { title: '', duration: 1, frequency: 'Daily' }, // Defaults
    activities: []
  });
  const viewingGoalId = ref(null); // ID of goal being viewed (if null, viewing current active)
  const router = useRouter();

  function login(username) {
    user.value = { name: username };
    localStorage.setItem('user', JSON.stringify(user.value));
  }

  function logout() {
    user.value = null;
    localStorage.removeItem('user');
    // Router redirect handled in component or global guard usually, but good to have state clear here
  }

  function setGoalData(data) {
    onboardingData.value.goal = { ...onboardingData.value.goal, ...data };
  }

  function addActivity(activity) {
    onboardingData.value.activities.push(activity);
  }

  function removeActivity(index) {
    onboardingData.value.activities.splice(index, 1);
  }

  async function finishOnboarding() {
    try {
        // Calculate end_date based on duration
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + onboardingData.value.goal.duration);

        // Save Goal
        const goalId = await db.goals.add({
            title: onboardingData.value.goal.title,
            duration: onboardingData.value.goal.duration,
            frequency: onboardingData.value.goal.frequency,
            status: 'active',
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            createdAt: new Date()
        });

        // Save Activities
        const todayDate = new Date().toISOString().split('T')[0];
        const activitiesToSave = onboardingData.value.activities.map(act => ({
            goalId: goalId,
            title: act.title,
            points: act.points,
            status: 'pending',
            date: todayDate // Tag with today's date
        }));
        
        await db.activities.bulkAdd(activitiesToSave);

        // Reset Onboarding Data
        onboardingData.value = { goal: { title: '', duration: 1, frequency: 'Daily' }, activities: [] };
        
        return true;
    } catch (error) {
        console.error("Failed to save onboarding data:", error);
        return false;
    }
  }

  function setViewingGoal(id) {
    viewingGoalId.value = id;
  }

  function clearViewingGoal() {
    viewingGoalId.value = null;
  }

  return { 
    user, 
    onboardingData, 
    viewingGoalId,
    login, 
    logout, 
    setGoalData, 
    addActivity, 
    removeActivity,
    finishOnboarding,
    setViewingGoal,
    clearViewingGoal
  };
});
