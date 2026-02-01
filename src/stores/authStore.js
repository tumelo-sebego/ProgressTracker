import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '../db/schema';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user')) || null);
  const onboardingData = ref({
    goal: { title: '', duration: 1, frequency: '1 Day/Week', weeklyDays: 1, startPreference: 'Today', customStartDate: '' }, // Defaults
    activities: []
  });
  const viewingGoalId = ref(null); // ID of goal being viewed (if null, viewing current active)
  const router = useRouter();

  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  async function signup(name, email, password) {
    try {
      const userId = await db.users.add({ name, email, password });
      user.value = { id: userId, name, email };
      localStorage.setItem('user', JSON.stringify(user.value));
      return true;
    } catch (error) {
      console.error("Signup failed", error);
      return false;
    }
  }

  async function login(email, password) {
    try {
      const foundUser = await db.users.where('email').equals(email).first();
      if (foundUser && foundUser.password === password) {
        user.value = { id: foundUser.id, name: foundUser.name, email: foundUser.email };
        localStorage.setItem('user', JSON.stringify(user.value));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed", error);
      return false;
    }
  }

  function logout() {
    user.value = null;
    localStorage.removeItem('user');
    onboardingData.value = { goal: { title: '', duration: 1, frequency: '1 Day/Week', weeklyDays: 1, startPreference: 'Today', customStartDate: '' }, activities: [] };
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
    if (!user.value) {
        alert("Development Mode: No user logged in. Progress will not be saved to the database.");
        return true; // Allow proceeding in dev mode
    }
    try {
        // Calculate start_date based on preference
        let startDate = new Date();
        if (onboardingData.value.goal.startPreference === 'Tomorrow') {
            startDate.setDate(startDate.getDate() + 1);
        } else if (onboardingData.value.goal.startPreference === 'Specific Date' && onboardingData.value.goal.customStartDate) {
            startDate = new Date(onboardingData.value.goal.customStartDate);
        }
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + onboardingData.value.goal.duration);

        const startDateStr = getLocalDateString(startDate);
        const endDateStr = getLocalDateString(endDate);

        // Save Goal
        const goalId = await db.goals.add({
            userId: user.value.id,
            title: onboardingData.value.goal.title,
            duration: onboardingData.value.goal.duration,
            frequency: onboardingData.value.goal.frequency,
            weeklyDays: onboardingData.value.goal.weeklyDays,
            status: 'active',
            start_date: startDateStr,
            end_date: endDateStr,
            createdAt: new Date()
        });

        // Save Activities
        // Tag activities with the actual start date for the first set
        const activitiesStartDate = startDateStr;
        const activitiesToSave = onboardingData.value.activities.map(act => ({
            userId: user.value.id,
            goalId: goalId,
            title: act.title,
            points: act.points,
            status: 'pending',
            date: activitiesStartDate
        }));
        
        await db.activities.bulkAdd(activitiesToSave);

        // Reset Onboarding Data
        onboardingData.value = { goal: { title: '', duration: 1, frequency: '1 Day/Week', weeklyDays: 1, startPreference: 'Today', customStartDate: '' }, activities: [] };
        
        return true;
    } catch (error) {
        console.error("Failed to save onboarding data:", error);
        return false;
    }
  }

  async function deleteGoal(goalId) {
    try {
      // Delete associated activities
      await db.activities.where('goalId').equals(goalId).delete();
      // Delete the goal
      await db.goals.delete(goalId);
      
      if (viewingGoalId.value === goalId) {
        viewingGoalId.value = null;
      }
      return true;
    } catch (error) {
      console.error("Failed to delete goal:", error);
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
    signup,
    login, 
    logout, 
    setGoalData, 
    addActivity, 
    removeActivity,
    finishOnboarding,
    deleteGoal,
    setViewingGoal,
    clearViewingGoal
  };
});
