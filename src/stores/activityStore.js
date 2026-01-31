import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { db } from '../db/schema';
import { liveQuery } from 'dexie';

export const useActivityStore = defineStore('activity', () => {
    const currentActivity = ref(null);
    const isOpen = ref(false);
    const isAnyRunning = ref(false);

    // Watch for any active activity
    liveQuery(() => db.activities.where('status').equals('active').count())
        .subscribe(count => {
            isAnyRunning.value = count > 0;
        });

    function openActivity(activity) {
        currentActivity.value = activity;
        isOpen.value = true;
    }

    function closeActivity() {
        isOpen.value = false;
        // Delay clearing activity to allow animation to finish using snapshot? 
        // Or just clear after timeout. For now clear immediately might cause flicker?
        // Let's keep it simple: clear after short delay or let valid activity persist while closing.
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
            startTime: now, // Keep for legacy/internal timer if needed
            start_time: now, // NEW
            date: new Date().toISOString() // NEW
        });
        
        const updated = await db.activities.get(id);
        currentActivity.value = updated;
    }

    async function finishActivity() {
        if (!currentActivity.value) return;
        const id = currentActivity.value.id;
        const now = Date.now();
        
        let durationVal = 0;
        // Use start_time if available, otherwise fallback to startTime
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
            startTime: null, // Clear internal timer ref
            end_time: now, // NEW
            duration: durationVal // NEW/Track duration
        });

        const updated = await db.activities.get(id);
        currentActivity.value = updated;
    }

    return {
        currentActivity,
        isOpen,
        isAnyRunning,
        openActivity,
        closeActivity,
        startActivity,
        finishActivity
    };
});
