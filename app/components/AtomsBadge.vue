<script setup lang="ts">
/**
 * AtomsBadge
 * [Atoms] 状態、カテゴリ、タグなどを視覚的に示すためのバッジコンポーネント。
 */
const { color = 'var(--color-text-muted)' } = defineProps<{
  color?: string
}>()
</script>

<template>
  <span
    class="relative inline-flex items-center justify-center py-0.5 px-1 whitespace-nowrap badge"
    :style="{ '--glow-color': color }"
  >
    <slot />
  </span>
</template>

<style scoped lang="scss">
.badge {
  --glow-color: var(--color-text-muted);

  user-select: none;

  z-index: 1;

  border: var(--border-width-base) solid color-mix(in srgb, var(--glow-color) 60%, transparent);
  border-radius: var(--radius-sm);

  font-size: var(--font-size-2xs);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--glow-color);
  text-shadow: var(--text-glow-sm);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);

  box-shadow: var(--shadow-glow-base);

  transition: var(--transition-base);
}
</style>
