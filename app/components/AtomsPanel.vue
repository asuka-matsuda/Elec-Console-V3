<script setup lang="ts">
/**
 * AtomsPanel
 * [Atoms] コンテンツやセクションを囲むための汎用パネルコンポーネント。
 */
defineProps<{
  as?: string
}>()
</script>

<template>
  <component
    :is="as || 'section'"
    class="relative overflow-hidden flex flex-col gap-[var(--space-panel-gap)] p-[var(--space-panel-pad)] panel"
  >
    <slot name="header" />
    <slot />
    <footer v-if="$slots.footer" class="flex items-center justify-end gap-2">
      <slot name="footer" />
    </footer>
  </component>
</template>

<style scoped lang="scss">
.panel {
  z-index: 1;

  border: var(--border-width-base) solid var(--color-border);
  border-radius: var(--radius-sm);

  background-color: var(--surface-bg);
  backdrop-filter: blur(var(--blur-sm));
  box-shadow: var(--shadow-elevation-sm);

  transition: var(--transition-base);
}
</style>
