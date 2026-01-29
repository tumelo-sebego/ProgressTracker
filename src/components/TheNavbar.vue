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
        <component :is="link.icon" class="nav-icon" />
        <span class="nav-text">{{ link.label }}</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { defineComponent, h } from 'vue';

// Simple SVG Icons as components
const IconHome = defineComponent({
  render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor', width: '24', height: '24' }, [
    h('path', { d: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' })
  ])
});

const IconProgress = defineComponent({
  render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor', width: '24', height: '24' }, [
    h('path', { d: 'M4 11h5v-6H4v6zm0 7h5v-6H4v6zm6 0h5v-6h-5v6zm6 0h5v-6h-5v6zm-6-7h5v-6h-5v6zm6-6v6h5v-6h-5z' }) // Grid-like icon
  ])
});

const IconProfile = defineComponent({
  render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor', width: '24', height: '24' }, [
    h('path', { d: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.58 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z' }) // Settings cog
  ])
});

const links = [
  { name: 'home', path: '/', label: 'Home', icon: IconHome },
  { name: 'progress', path: '/progress', label: 'Progress', icon: IconProgress },
  { name: 'profile', path: '/profile', label: 'Settings', icon: IconProfile },
];
</script>

<style scoped>
.navbar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #1a1a1a;
  padding: 8px;
  border-radius: 99px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  z-index: 100;
}

.nav-container {
  display: flex;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px;
  color: #fff;
  text-decoration: none;
  border-radius: 99px;
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  background-color: transparent;
  overflow: hidden;
}

.nav-item:hover {
    background-color: rgba(255,255,255,0.1);
}

.nav-item.active {
  background-color: #42b883; /* Theme Green */
  color: #1a1a1a; /* Dark text on green for contrast */
  padding-right: 20px;
  padding-left: 20px;
}

.nav-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.nav-text {
  max-width: 0;
  opacity: 0;
  white-space: nowrap;
  margin-left: 0;
  font-weight: 600;
  transition: all 0.3s ease;
}

.nav-item.active .nav-text {
  max-width: 100px;
  opacity: 1;
  margin-left: 10px;
}
</style>
