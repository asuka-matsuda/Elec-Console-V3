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
  | "danger";

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
  // SCSS Variables & Maps
  $variants: (
    "neutral": "--color-text-main",
    "primary": "--color-category-main",
    "success": "--color-status-success",
    "warning": "--color-status-warning",
    "danger": "--color-status-danger",
  );

  // CSS Custom Properties
  --glow-color: var(--color-text-main);

  // Extends
  @extend %text-label;

  // Layout & Positioning
  @include flex-center(0, inline-flex);

  // Misc
  user-select: none;

  // Box Model
  padding: var(--pad-element);
  border: var(--border-width-base) solid theme-color(var(--glow-color), 60%);

  // Typography
  color: var(--glow-color);
  white-space: nowrap;

  // Visuals & Effects
  @include state-base(var(--shadow-glow-hover), var(--transition-base));
  @include cyber-text-glow(100%, var(--blur-sm), var(--glow-color));

  // Modifiers
  @each $name, $var in $variants {
    &--#{$name} {
      --glow-color: var(#{$var});
    }
  }
}
</style>
