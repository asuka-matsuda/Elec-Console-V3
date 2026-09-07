<script setup lang="ts">
/**
 * AppBadge
 * 状態、カテゴリ、タグなどを視覚的に示すためのバッジコンポーネント。
 */
const { color = 'var(--color-text-muted)' } = defineProps<{
  color?: string
}>()
</script>

<template>
  <span
    class="c-badge"
    :style="{ '--glow-color': color }"
  >
    <slot />
  </span>
</template>

<style scoped lang="scss">
.c-badge {
  --glow-color: var(--color-text-muted);

  user-select: none;

  position: relative;
  z-index: 1;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding: var(--space-0-5) var(--space-1);
  border: var(--border-width-base) solid color-mix(in srgb, var(--glow-color) 60%, transparent);
  border-radius: var(--radius-sm);

  font-size: var(--font-size-2xs);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--glow-color);
  text-shadow: 0 0 var(--blur-sm) var(--glow-color);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  white-space: nowrap;

  box-shadow: var(--shadow-glow-base);

  transition: var(--transition-base);
}
</style>
