<template>
  <main>
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </main>
  
  <TheNavbar v-if="!$route.meta.hideNavbar" />

  <!-- Global Activity Timer Dialog -->
  <Transition name="slide-up">
    <ActivityTimerDialog 
        v-if="activityStore.isOpen" 
        :activity="activityStore.currentActivity"
        @close="activityStore.closeActivity()"
    />
  </Transition>
</template>

<script setup>
import TheNavbar from './components/TheNavbar.vue';
import ActivityTimerDialog from './components/ActivityTimerDialog.vue';
import { useActivityStore } from './stores/activityStore';

const activityStore = useActivityStore();
</script>

<style>
/* Page Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Global Dialog Slide Up Animation */
.slide-up-enter-active {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-leave-active {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
}

.slide-up-enter-from {
  transform: translateY(100%);
}

.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0; /* Fade out midway */
}
</style>
