<script setup lang="ts">
/**
 * AtomsPanel
 * [Atoms] 背景・枠線・角丸・影などの装飾のみを提供する純粋なサーフェス枠コンポーネント。
 */
defineProps<{
  as?: string
}>()
</script>

<template>
  <component
    :is="as || 'section'"
    class="relative z-[1] overflow-hidden panel"
  >
    <slot />
  </component>
</template>

<style scoped lang="scss">
.panel {
  padding: var(--space-panel-pad);
  border: var(--border-width-base) solid var(--color-border);
  border-radius: var(--radius-sm);

  background-color: var(--surface-bg);
  backdrop-filter: blur(var(--blur-sm));
  box-shadow: var(--shadow-elevation-sm);

  transition: var(--transition-base);
}
</style>
