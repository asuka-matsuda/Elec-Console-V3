<script setup lang="ts">
import { watchEffect } from 'vue'

import { useSettings } from '~/composables/useSettings'

const { themeMode } = useSettings()

if (import.meta.client) {
  watchEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode.value)
  })
}
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
