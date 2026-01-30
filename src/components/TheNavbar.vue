<template>
  <nav class="navbar">
    <div class="nav-container">
      <router-link 
        v-for="link in links" 
        :key="link.name" 
        :to="link.path"
        class="nav-item"
        active-class="active"
      >
        <!-- Logic: If active, show Text ONLY. If inactive, show Icon ONLY. -->
        <!-- Vue Router's router-link doesn't expose 'isActive' in slot easily without v-slot. 
             So we use v-slot API or CSS toggling. CSS toggling is smoother for transitions, 
             but "display: none" breaks layout transitions. 
             The user requested: "when a tab is active, the icon of that menu-item is hidden... its eitther an icon or text".
        -->
        <template v-slot="{ isActive }">
            <span v-if="isActive" class="nav-text">{{ link.label }}</span>
            <component v-else :is="link.icon" class="nav-icon" />
        </template>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { defineComponent, h } from 'vue';

// Simple SVG Icons
const IconHome = defineComponent({
  render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor', width: '24', height: '24' }, [
    h('path', { d: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' })
  ])
});

const IconProgress = defineComponent({
  render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor', width: '24', height: '24' }, [
    h('path', { d: 'M4 11h5v-6H4v6zm0 7h5v-6H4v6zm6 0h5v-6h-5v6zm6 0h5v-6h-5v6zm-6-7h5v-6h-5v6zm6-6v6h5v-6h-5z' }) 
  ])
});

const IconProfile = defineComponent({
  render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor', width: '24', height: '24' }, [
    h('path', { d: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.58 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z' }) 
  ])
});

const links = [
  { name: 'home', path: '/', label: 'Home', icon: IconHome },
  { name: 'progress', path: '/progress', label: 'Progress', icon: IconProgress }, // Assuming ProgressView exists
  { name: 'profile', path: '/profile', label: 'Settings', icon: IconProfile }, // Assuming UserProfile/Settings exists
];
</script>

<style scoped>
.navbar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #1a1a1a; 
  padding: 8px 12px; /* Slightly more side padding */
  border-radius: 24px; /* Less rounded to match wide feel? Or keep 99px for pill shape. User image usually high border radius. Keeping 99px is safer for 'pill'. But 20px matches cards? Let's stick to 24px or 30px to look like a bar */
  border-radius: 99px; /* Sticking to pill shape as requested "navigation component should also look like the one in the image" */
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
  z-index: 100;
  display: flex;
  align-items: center;
  width: calc(100% - 48px); /* Match HomeView padding: 24px left + 24px right */
  max-width: 552px; /* 600px - 48px */
  box-sizing: border-box;
}

.nav-container {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  min-width: 44px; /* Circle for icon */
  color: #888; /* Inactive color */
  text-decoration: none;
  border-radius: 99px;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  background-color: transparent;
  padding: 0 10px; /* Slight padding for text mode */
  box-sizing: border-box;
}

.nav-item:hover {
    color: #fff;
    background-color: rgba(255,255,255,0.05);
}

.nav-item.router-link-active {
  background-color: var(--primary-color);
  color: #1a1a1a;
  padding: 0 20px; /* Wider for text pill */
}

/* Icon Styles */
.nav-icon {
  width: 24px;
  height: 24px;
  color: inherit;
}

/* Text Styles */
.nav-text {
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
}
</style>
