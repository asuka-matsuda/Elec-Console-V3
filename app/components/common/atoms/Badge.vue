<script setup lang="ts">
/**
 * Badge
 * Geist デザインシステム準拠のバッジコンポーネント。
 * 短くスキャンしやすいメタデータ（ステータス、ロール、環境等）を強調表示します。
 */
import { computed } from 'vue'

import type { BadgeProps, BadgeVariant } from '~/types/components'

const {
  variant = 'gray',
  contrast = 'high',
  size = 'md',
  icon,
} = defineProps<BadgeProps>()

/**
 * セマンティックエイリアスを Geist 標準カラー名に正規化
 */
const normalizedVariant = computed(() => {
  const map: Record<string, BadgeVariant> = {
    default: 'gray',
    primary: 'blue',
    success: 'green',
    warning: 'amber',
    danger: 'red',
    accent: 'purple',
    neutral: 'gray',
  }

  return map[variant] ?? (variant as BadgeVariant)
})
</script>

<template>
  <span class="inline-flex shrink-0 items-center justify-center gap-inline-gap badge" :class="[`badge--${normalizedVariant}`, `badge--${size}`, { 'is-subtle': contrast === 'low' }]">
    <Icon v-if="icon" :name="icon" size="sm" class="badge-icon" />
    <slot />
  </span>
</template>

<style scoped lang="scss">
.badge {
  --badge-color: var(--color-text-muted);

  user-select: none;

  border: var(--border-width-base) solid color-mix(in srgb, var(--badge-color) 35%, transparent);

  font-family: var(--font-mono);
  font-weight: var(--font-weight-semibold);
  line-height: 1;
  color: var(--badge-color);
  letter-spacing: var(--tracking-wide);
  white-space: nowrap;

  background-color: color-mix(in srgb, var(--badge-color) 12%, transparent);

  // --- Sizes ---
  &--sm {
    padding: 0.15em 0.45em;
    font-size: var(--font-size-2xs);
  }

  &--md {
    padding: 0.2em 0.6em;
    font-size: var(--font-size-xs);
  }

  &--lg {
    padding: 0.3em 0.8em;
    font-size: var(--font-size-sm);
  }

  // --- Contrast: Low (Subtle) ---
  &.is-subtle {
    border-color: color-mix(in srgb, var(--badge-color) 20%, transparent);
    color: color-mix(in srgb, var(--badge-color) 85%, var(--color-text-main));
    background-color: color-mix(in srgb, var(--badge-color) 6%, transparent);
  }

  // --- Geist Color Variants ---
  &--gray {
    --badge-color: var(--color-text-muted);
  }

  &--blue {
    --badge-color: var(--color-category-main);
  }

  &--purple {
    --badge-color: var(--color-role-admin);
  }

  &--amber {
    --badge-color: var(--color-status-warning);
  }

  &--red {
    --badge-color: var(--color-status-danger);
  }

  &--pink {
    --badge-color: var(--color-category-reference);
  }

  &--green {
    --badge-color: var(--color-status-success);
  }

  &--teal {
    --badge-color: var(--color-category-tool);
  }

  &--inverted {
    border-color: transparent;
    color: var(--color-main-bg);
    background-color: var(--color-text-main);
  }

  .badge-icon {
    font-size: 1em;
  }
}
</style>
