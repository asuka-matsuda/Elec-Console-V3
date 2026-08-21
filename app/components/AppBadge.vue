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
  --badge-color: var(--color-text-main);
  --badge-border: theme-color(var(--color-border), 50%);
  --badge-shadow: transparent;

  // --- Base Styling ---
  @extend %text-2xs;

  // --- Base Styles ---
  user-select: none;

  padding: var(--pad-element);
  border: var(--border-width-base) solid var(--badge-border);

  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--badge-color);
  text-transform: uppercase;
  white-space: nowrap;

  box-shadow:
    inset 0 0 var(--blur-sm) var(--badge-shadow),
    0 0 var(--blur-md) var(--badge-shadow);

  transition: var(--transition-base);
  
  @include flex-center(0, inline-flex);
  @include cyber-text-glow(100%, var(--blur-sm), var(--badge-color));

  // --- Color Modifiers ---
  @each $name, $var in $variants {
    &--#{$name} {
      --badge-color: var(#{$var});
      --badge-border: #{theme-color(var(#{$var}), 60%)};
      --badge-shadow: #{theme-color(var(#{$var}), 30%)};
    }
  }
}
</style>
