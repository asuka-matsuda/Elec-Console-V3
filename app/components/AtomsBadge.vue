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
    class="relative z-[1] inline-flex items-center justify-center whitespace-nowrap badge"
    :style="{ '--glow-color': color }"
  >
    <slot />
  </span>
</template>

<style scoped lang="scss">
.badge {
  --glow-color: var(--color-text-muted);

  user-select: none;

  padding: 0.15em 0.5em;
  border: var(--border-width-base) solid color-mix(in srgb, var(--glow-color) 35%, transparent);
  border-radius: var(--radius-sm);

  font-size: 0.8em;
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--glow-color);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);

  background-color: color-mix(in srgb, var(--glow-color) 14%, transparent);

  transition: var(--transition-base);
}
</style>
