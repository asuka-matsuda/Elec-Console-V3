<script setup lang="ts">
/**
 * AppBadge
 * 状態やカテゴリを視覚的に示すためのバッジコンポーネント
 */

/**
 * バッジのカラーバリエーション
 */
export type BadgeVariant =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "tool"
  | "database"
  | "reference"
  | "management";

withDefaults(
  defineProps<{
    variant?: BadgeVariant;
  }>(),
  {
    variant: "neutral",
  },
);
</script>

<template>
  <span class="c-badge" :class="[`c-badge--${variant}`]">
    <slot />
  </span>
</template>

<style scoped lang="scss">
.c-badge {
  $variants: (
    "primary": "--color-category-main",
    "success": "--color-status-success",
    "warning": "--color-status-warning",
    "danger": "--color-status-danger",
    "tool": "--color-category-tool",
    "database": "--color-category-database",
    "reference": "--color-category-reference",
    "management": "--color-category-management",
  );

  // --- Theme Variables ---
  --glow-color: var(--color-text-main);

  // --- Base Styling ---
  @extend %text-2xs;

  user-select: none;

  padding: var(--pad-element);
  border: var(--border-width-base) solid theme-color(var(--glow-color), 60%);

  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--glow-color);
  text-transform: uppercase;
  white-space: nowrap;

  @include state-base(var(--shadow-glow-hover), var(--transition-base));
  
  @include flex-center(0, inline-flex);
  @include cyber-text-glow(100%, var(--blur-sm), var(--glow-color));

  // --- Color Modifiers ---
  @each $name, $var in $variants {
    &--#{$name} {
      --glow-color: var(#{$var});
    }
  }
}
</style>

