<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  if (typeof window !== 'undefined' && (window as any).feather) {
    (window as any).feather.replace()
  }
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
