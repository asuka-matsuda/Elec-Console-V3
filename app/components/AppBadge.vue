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
  // 1. SCSS Variables & Maps
  $variants: (
    "neutral": "--color-text-main",
    "primary": "--color-category-main",
    "success": "--color-status-success",
    "warning": "--color-status-warning",
    "danger": "--color-status-danger",
  );

  // 2. CSS Custom Properties
  --glow-color: var(--color-text-main);

  // 3. Extends
  @extend %text-label;

  // 4. Layout & Positioning
  @include flex-center(0, inline-flex);

  // 8. Misc
  user-select: none;

  // 5. Box Model
  padding: var(--pad-element);
  border: var(--border-width-base) solid theme-color(var(--glow-color), 60%);

  // 6. Typography
  color: var(--glow-color);
  white-space: nowrap;

  // 7. Visuals & Effects
  @include state-base(var(--shadow-glow-hover), var(--transition-base));
  @include cyber-text-glow(100%, var(--blur-sm), var(--glow-color));

  // 9. Modifiers
  @each $name, $var in $variants {
    &--#{$name} {
      --glow-color: var(#{$var});
    }
  }
}
</style>


