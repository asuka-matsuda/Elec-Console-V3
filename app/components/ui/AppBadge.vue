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
  | "neutral"
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
  // --- SCSS変数・マップ ---
  $variants: (
    "neutral": "--color-text-main",
    "secondary": "--color-text-muted",
    "primary": "--color-category-main",
    "success": "--color-status-success",
    "warning": "--color-status-warning",
    "danger": "--color-status-danger",
    "tool": "--color-category-main",
  );

  // --- CSSカスタムプロパティ ---
  --glow-color: var(--color-text-main);

  // --- 継承 ---
  @extend %text-badge;

  // --- レイアウト・配置 ---
  @include inline-flex-center;

  // --- その他 ---
  user-select: none;

  // --- ボックスモデル ---
  padding: var(--pad-element);

  @include border-dim(var(--glow-color), 60%);

  // --- タイポグラフィ ---
  color: var(--glow-color);
  white-space: nowrap;

  // --- 視覚効果 ---
  @include state-base(var(--shadow-glow-hover));
  @include cyber-text-glow(var(--glow-color), 100%, var(--blur-sm));

  @each $name, $var in $variants {
    // --- モディファイア ---
    &--#{$name} {
      // --- CSSカスタムプロパティ ---
      --glow-color: var(#{$var});
    }
  }
}
</style>
