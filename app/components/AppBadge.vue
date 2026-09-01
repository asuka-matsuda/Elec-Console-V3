<script setup lang="ts">
/**
 * AppBadge
 * 状態、カテゴリ、タグなどを視覚的に示すためのバッジコンポーネント。
 */

/**
 * プリセットカラー定義（型補完用）
 */
export type BadgePresetColor
  = | 'secondary'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'tool'
    | 'portal'
    | 'database'
    | 'reference'
    | 'neutral'

/**
 * プリセット名または任意のCSSカラー（#HEX, rgb(), hsl(), var() など）
 */
export type BadgeColor = BadgePresetColor | (string & {})

const props = withDefaults(
  defineProps<{
    /** 表示カラー（プリセット名 または 任意のカラーコード/CSS変数） */
    color?: BadgeColor
  }>(),
  {
    color: 'secondary',
  },
)

const presetMap: Record<string, string> = {
  secondary: 'var(--color-text-muted)',
  primary: 'var(--theme-accent)',
  main: 'var(--theme-accent)',
  success: 'var(--color-status-success)',
  warning: 'var(--color-status-warning)',
  danger: 'var(--color-status-danger)',
  tool: 'var(--color-category-tool)',
  portal: 'var(--color-category-management)',
  management: 'var(--color-category-management)',
  database: 'var(--color-category-database)',
  reference: 'var(--color-category-reference)',
  accent: 'var(--color-accent-main)',
  stopped: 'var(--color-status-stopped)',
  neutral: 'var(--color-status-neutral)',
}

const badgeStyle = computed(() => {
  const resolvedColor = presetMap[props.color] || props.color

  return {
    '--glow-color': resolvedColor,
  }
})
</script>

<template>
  <span
    class="c-badge"
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
  @include cyber-text-glow(var(--glow-color), 100%, var(--blur-sm));
  @include border-base(var(--glow-color), 60%);
  @include state-base(none, var(--transition-base), var(--glow-color));

  user-select: none;
  padding: var(--space-badge-p);
  color: var(--glow-color);
  white-space: nowrap;
}
</style>
