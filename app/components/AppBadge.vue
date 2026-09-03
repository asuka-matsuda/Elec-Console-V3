<script setup lang="ts">
/**
 * AppBadge
 * 状態、カテゴリ、タグなどを視覚的に示すためのバッジコンポーネント。
 */

/**
 * プリセットカラー定義（型補完用）
 */
export type BadgePresetColor =
  | "secondary"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "tool"
  | "portal"
  | "database"
  | "reference"
  | "neutral";

/**
 * プリセット名または任意のCSSカラー（#HEX, rgb(), hsl(), var() など）
 */
export type BadgeColor = BadgePresetColor | (string & {});

const props = withDefaults(
  defineProps<{
    /** 表示カラー（プリセット名 または 任意のカラーコード/CSS変数） */
    color?: BadgeColor;
  }>(),
  {
    color: "secondary",
  },
);

const presetMap: Record<string, string> = {
  secondary: "var(--color-text-muted)",
  primary: "var(--theme-accent)",
  main: "var(--theme-accent)",
  success: "var(--color-status-success)",
  warning: "var(--color-status-warning)",
  danger: "var(--color-status-danger)",
  tool: "var(--color-category-tool)",
  portal: "var(--color-category-management)",
  management: "var(--color-category-management)",
  database: "var(--color-category-database)",
  reference: "var(--color-category-reference)",
  accent: "var(--color-accent-main)",
  stopped: "var(--color-status-stopped)",
  neutral: "var(--color-status-neutral)",
};

const resolvedColor = computed(() => presetMap[props.color] || props.color);
</script>

<template>
  <span class="c-badge">
    <slot />
  </span>
</template>

<style scoped lang="scss">
.c-badge {
  --glow-color: v-bind("resolvedColor");

  @include flex-center-center($is-inline: true);
  @include text-badge;

  user-select: none;
  padding: var(--space-0-5) var(--space-1);
  color: var(--glow-color);
  white-space: nowrap;

  @include cyber-text-glow(var(--glow-color), 100%, var(--blur-sm));
  @include border-base(var(--glow-color), 60%);
  @include state-base(none, var(--transition-base), var(--glow-color));
}
</style>
