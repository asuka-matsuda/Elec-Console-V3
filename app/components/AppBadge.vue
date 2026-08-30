<script setup lang="ts">
/**
 * AppBadge
 * 状態やカテゴリを視覚的に示すためのバッジコンポーネント。
 */

/**
 * バッジのカラーバリエーション
 */
export type BadgeVariant = 
  | "secondary"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "tool";

withDefaults(
  defineProps<{
    variant?: BadgeVariant;
  }>(),
  {
    variant: "secondary",
  },
);
</script>

<template>
  <span
    class="c-badge"
    :class="[`c-badge--${variant}`]"
  >
    <slot />
  </span>
</template>

<style scoped lang="scss">
.c-badge {
  $variants: (
    "secondary": "--color-text-muted",
    "primary": "--color-category-main",
    "success": "--color-status-success",
    "warning": "--color-status-warning",
    "danger": "--color-status-danger",
    "tool": "--color-category-main",
  );

  --glow-color: var(--color-text-main);

  @include inline-flex-center;
  @include text-badge;

  user-select: none;
  padding: var(--pad-element);
  color: var(--glow-color);
  white-space: nowrap;

  @include border-dim(var(--glow-color), 60%);
  @include state-base(var(--shadow-glow-hover));
  @include cyber-text-glow(var(--glow-color), 100%, var(--blur-sm));

  @each $name, $var in $variants {
    &--#{$name} {
      --glow-color: var(#{$var});
    }
  }
}
</style>
