<template>
  <div class="archive-banner">
    <span>👁 viewing past goal</span>
    <button @click="emit('exit')">Exit</button>
  </div>
</template>

<script setup>
const emit = defineEmits(['exit']);
</script>

<style scoped>
.archive-banner {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background: #1a1a1a;
    color: white;
    padding: 10px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 1000;
    box-sizing: border-box;
}

button {
    background: #42b883;
    border: none;
    color: white;
    padding: 4px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    font-size: 12px;
}
</style>
