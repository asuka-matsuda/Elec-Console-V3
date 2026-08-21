<script setup lang="ts">
/* ==========================================================================
   型定義
   ========================================================================== */

// バッジのカラーバリエーション定義
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

/* ==========================================================================
   Props定義
   ========================================================================== */

// バッジの色（variant）とサイズ（size）を受け取る
withDefaults(
  defineProps<{
    variant?: BadgeVariant;
    size?: "sm" | "md";
  }>(),
  {
    variant: "neutral",
    size: "sm",
  },
);
</script>

<template>
  <!-- ==========================================================================
       バッジ本体
       ========================================================================== -->
  <span class="c-badge" :class="[`c-badge--${variant}`, `c-badge--${size}`]">
    <slot />
  </span>
</template>

<style scoped lang="scss">
/* ==========================================================================
   バッジのスタイル
   ========================================================================== */

.c-badge {
  // テーマ値から参照するためのカスタムプロパティ
  --badge-color: var(--color-text-main);
  --badge-border: theme-color(var(--color-border), 50%);
  --badge-shadow: transparent;

  @include flex-center(0, inline-flex);

  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  color: var(--badge-color);
  border: var(--border-width-base) solid var(--badge-border);
  box-shadow:
    inset 0 0 var(--blur-sm) var(--badge-shadow),
    0 0 var(--blur-md) var(--badge-shadow);

  // テキストの発光エフェクト
  @include cyber-text-glow(100%, var(--blur-sm), var(--badge-color));

  line-height: var(--line-height-tight);
  white-space: nowrap;
  user-select: none;
  transition: var(--transition-base);

  /* サイズバリアント (Size Variants)
     ========================================================================== */

  &--sm {
    padding: var(--space-1);

    @extend %text-2xs;
  }

  &--md {
    padding: var(--space-2);

    @extend %text-xs;
  }

  /* カラーバリアント (Color Variants)
     ========================================================================== */

  // 各バリアントのクラス名と、対応するCSS変数のマップ
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

  // マップを展開して各バリアントのスタイルを自動生成する
  @each $name, $var in $variants {
    &--#{$name} {
      --badge-color: var(#{$var});
      --badge-border: #{theme-color(var(#{$var}), 60%)};
      --badge-shadow: #{theme-color(var(#{$var}), 30%)};
    }
  }
}
</style>
