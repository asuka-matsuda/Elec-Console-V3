<script setup lang="ts">
import { computed } from 'vue'

import { useRoute } from '#app'

const route = useRoute()
const pageTitle = computed(() => route.meta.title as string | undefined)
</script>

<template>
  <main class="login-layout">
    <AtomsPanel class="login-layout__panel">
      <AppSectionHeader v-if="pageTitle" :title="pageTitle" />
      <slot />
    </AtomsPanel>
  </main>
</template>

<style scoped lang="scss">
.login-layout {
  display: flex;
  flex: 1;
  gap: 0;
  align-items: center;
  justify-content: center;

  &__panel {
    min-width: 320px;
    max-width: 480px;
  }
}
</style>
