<script setup lang="ts">
import { computed } from 'vue'

import { useRoute } from '#app'

const route = useRoute()
const pageTitle = computed(() => route.meta.title as string | undefined)
</script>

<template>
  <main class="flex flex-1 items-center justify-center gap-0 login-layout">
    <AtomsPanel class="login-layout__panel">
      <MoleculesSectionHeader v-if="pageTitle" :title="pageTitle" />
      <slot />
    </AtomsPanel>
  </main>
</template>

<style scoped lang="scss">
.login-layout {
  &__panel {
    min-width: 320px;
    max-width: 480px;
  }
}
</style>
