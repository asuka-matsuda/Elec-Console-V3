<script setup lang="ts">
/**
 * Badge
 * 状態（ステータス）を表示するインジケーター。
 */
defineProps<{
  /** 表示色（CSS変数またはカラー値） */
  color?: string
}>()
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center badge"
    :style="color ? { '--glow-color': color } : undefined"
  >
    <slot />
  </span>
</template>

<style scoped lang="scss">
.badge {
  --glow-color: var(--color-text-muted);

  padding: 0.15em 0.5em;
  border: var(--border-width-base) solid color-mix(in srgb, var(--glow-color) 35%, transparent);

  font-size: 0.8em;
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--glow-color);
  letter-spacing: var(--tracking-wide);
  white-space: nowrap;

  background: color-mix(in srgb, var(--glow-color) 12%, transparent);
}
</style>
