<script setup lang="ts">
/**
 * AppPanel
 * コンテンツやセクションを囲むための汎用パネルコンポーネント。
 */
defineProps<{
  as?: string
}>()
</script>

<template>
  <component :is="as || 'section'" class="c-panel">
    <slot name="header" />
    <slot />
    <footer v-if="$slots.footer" class="c-panel__footer">
      <slot name="footer" />
    </footer>
  </component>
</template>

<style scoped lang="scss">
.c-panel {
  position: relative;
  z-index: 1;

  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--space-panel-gap);

  padding: var(--space-panel-pad);
  border: var(--border-width-base) solid var(--color-border);
  border-radius: var(--radius-sm);

  background-color: var(--surface-bg);
  backdrop-filter: blur(var(--blur-sm));
  box-shadow: var(--shadow-elevation-sm);

  transition: var(--transition-base);

  &__footer {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    justify-content: flex-end;
  }
}
</style>
