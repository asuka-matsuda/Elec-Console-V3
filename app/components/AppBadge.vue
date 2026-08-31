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
    /** バッジのサイズ */
    size?: "sm" | "md";
  }>(),
  {
    color: "secondary",
    size: "md",
  },
);

const presetMap: Record<string, string> = {
  secondary: "var(--color-text-muted)",
  primary: "var(--color-category-main)",
  main: "var(--color-category-main)",
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

const badgeStyle = computed(() => {
  const resolvedColor = presetMap[props.color] || props.color;
  return {
    "--glow-color": resolvedColor,
  };
});
</script>

<template>
  <span
    class="c-badge"
    :class="[`c-badge--${size}`]"
    :style="badgeStyle"
  >
    <slot />
  </span>
</template>

<style scoped lang="scss">
.c-badge {
  --glow-color: var(--color-text-muted);

  @include inline-flex-center;
  @include text-badge;

  user-select: none;
  padding: var(--space-badge-p);
  color: var(--glow-color);
  white-space: nowrap;

  @include border-dim(var(--glow-color), 60%);
  @include state-base(var(--shadow-glow-hover));
  @include cyber-text-glow(var(--glow-color), 100%, var(--blur-sm));

  &--sm {
    padding: var(--space-badge-p);
    font-size: var(--font-size-2xs);
  }

  &--md {
    padding: var(--space-tag-p);
  }
}
</style>
