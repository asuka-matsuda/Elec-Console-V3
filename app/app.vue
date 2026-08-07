<script setup lang="ts">
import { useHead } from "#app";
import { useSettings } from "~/composables/useSettings";

const { themeMode, baseBgStyle } = useSettings();

useHead({
  htmlAttrs: {
    "data-theme": themeMode,
    "data-base-bg": baseBgStyle,
  },
});

</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
