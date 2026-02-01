import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { db } from '../db/schema';
import { liveQuery } from 'dexie';
import { useAuthStore } from './authStore';

export const useActivityStore = defineStore('activity', () => {
    const currentActivity = ref(null);
    const isOpen = ref(false);
    const isAnyRunning = ref(false);

    const authStore = useAuthStore();

    // Reactive subscription to active activities
    let activitySubscription = null;
    watch(() => authStore.user, (newUser) => {
        if (activitySubscription) {
            activitySubscription.unsubscribe();
            activitySubscription = null;
        }

        if (newUser) {
            activitySubscription = liveQuery(() => {
                return db.activities
                    .where('[userId+status]')
                    .equals([newUser.id, 'active'])
                    .count();
            }).subscribe(count => {
                isAnyRunning.value = count > 0;
            });
        } else {
            isAnyRunning.value = false;
        }
    }, { immediate: true });

    function openActivity(activity) {
        currentActivity.value = activity;
        isOpen.value = true;
    }

    function closeActivity() {
        isOpen.value = false;
        setTimeout(() => {
            currentActivity.value = null;
        }, 300); // Match transition duration
    }

    async function startActivity() {
        if (!currentActivity.value) return;
        const now = Date.now();
        const id = currentActivity.value.id;
        
        await db.activities.update(id, {
            status: 'active',
            startTime: now,
            start_time: now
        });
        
        const updated = await db.activities.get(id);
        currentActivity.value = updated;
    }

    async function finishActivity() {
        if (!currentActivity.value) return;
        const id = currentActivity.value.id;
        const now = Date.now();
        
        let durationVal = 0;
        const startTimeVal = currentActivity.value.start_time || currentActivity.value.startTime;
        
        if (startTimeVal) {
            const diff = now - startTimeVal;
            durationVal = Math.round(diff / 60000); 
            if (durationVal < 1) durationVal = 1;
        } else {
            durationVal = currentActivity.value.points || 0;
        }

        await db.activities.update(id, {
            status: 'done',
            startTime: null,
            end_time: now,
            duration: durationVal
        });

        const updated = await db.activities.get(id);
        currentActivity.value = updated;
    }

    async function checkAndResetDaily() {
        console.log("Checking and resetting daily activities...");
        const todayDate = new Date().toISOString().split('T')[0];
        
        await db.activities.toCollection().modify(a => {
            if (a.date && a.date.includes('T')) {
                a.date = a.date.split('T')[0];
            }
        });

        await db.goals.toCollection().modify(g => {
            if (g.startDate && !g.start_date) {
                g.start_date = new Date(g.startDate).toISOString().split('T')[0];
            }
            if (!g.start_date && g.createdAt) {
                g.start_date = new Date(g.createdAt).toISOString().split('T')[0];
            }
            if (!g.end_date && g.start_date && g.duration) {
                const start = new Date(g.start_date);
                const end = new Date(start);
                end.setDate(start.getDate() + g.duration);
                g.end_date = end.toISOString().split('T')[0];
            }
        });

        if (!authStore.user) return;
        
        const activeGoal = await db.goals
            .where('[userId+status]')
            .equals([authStore.user.id, 'active'])
            .first();

        if (!activeGoal) return;

        const countToday = await db.activities
            .where('[userId+goalId+date]')
            .equals([authStore.user.id, activeGoal.id, todayDate])
            .count();

        if (countToday === 0) {
            console.log("New day detected. Calculating cycle state...");
            
            // Calculate if today is a rest day
            const start = new Date(activeGoal.start_date);
            const today = new Date(todayDate);
            const diffInTime = today.getTime() - start.getTime();
            const diffInDays = Math.floor(diffInTime / (1000 * 3600 * 24));

            if (diffInDays < 0) {
                console.log("Goal hasn't started yet.");
                return;
            }

            const dayInCycle = diffInDays % 7;
            const isRestDay = dayInCycle >= (activeGoal.weeklyDays || 7);

            // Clean up any old pending activities
            await db.activities
                .where('goalId').equals(activeGoal.id)
                .and(a => a.status === 'pending' && a.date !== todayDate)
                .modify({ status: 'expired' });

            if (isRestDay) {
                console.log("Today is a rest day. No activities generated.");
                return;
            }

            console.log("Active day in cycle. Generating activities...");
            const allGoalActivities = await db.activities
                .where('goalId').equals(activeGoal.id)
                .toArray();
            
            const templateMap = new Map();
            allGoalActivities.forEach(a => {
                if (!templateMap.has(a.title)) {
                    templateMap.set(a.title, { 
                        title: a.title, 
                        points: a.points, 
                        goalId: a.goalId 
                    });
                }
            });

            const newActivities = Array.from(templateMap.values()).map(a => ({
                ...a,
                userId: authStore.user.id,
                status: 'pending',
                date: todayDate
            }));

            if (newActivities.length > 0) {
                await db.activities.bulkAdd(newActivities);
            }
        }
    }

    console.log("Activity store initialized with checkAndResetDaily:", typeof checkAndResetDaily);

    return {
        currentActivity,
        isOpen,
        isAnyRunning,
        openActivity,
        closeActivity,
        startActivity,
        finishActivity,
        checkAndResetDaily
    };
});
