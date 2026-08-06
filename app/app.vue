<script setup lang="ts">
import { onMounted } from "vue";
import { useHead } from "#app";

useHead({
  htmlAttrs: {
    "data-theme": "dark",
    "data-base-bg": "aurora",
  },
});

onMounted(() => {
  if (typeof window !== "undefined" && (window as any).feather) {
    (window as any).feather.replace();
  }
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
