<template>
  <div class="pulsating-dot-container">
    <div class="dot-core"></div>
    <div class="dot-wave wave-1"></div>
    <div class="dot-wave wave-2"></div>
    <div class="dot-wave wave-3"></div>
  </div>
</template>

<style scoped>
.pulsating-dot-container {
  position: relative;
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.dot-core {
  width: 10px;
  height: 10px;
  background-color: #9b59b6;
  border-radius: 50%;
  z-index: 2;
}

.dot-wave {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: #9b59b6;
  border-radius: 50%;
  opacity: 0.6;
  z-index: 1;
}

.wave-1 {
  animation: pulse 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
}

.wave-2 {
  animation: pulse 2s infinite 0.66s cubic-bezier(0.4, 0, 0.6, 1);
}

.wave-3 {
  animation: pulse 2s infinite 1.33s cubic-bezier(0.4, 0, 0.6, 1);
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
}
</style>
