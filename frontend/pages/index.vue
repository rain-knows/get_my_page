<script setup lang="ts">
const { public: { apiBase } } = useRuntimeConfig()
</script>

<template>
  <main>
    <h1>Blog System</h1>
    <p>Nuxt 4 初始化完成。</p>
    <p>API: {{ apiBase }}</p>
  </main>
</template>
