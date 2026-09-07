<script setup lang="ts">
/**
 * ToolResultDetailsRow
 * 計算結果の詳細情報の各行を表示するコンポーネントです。ラベルと値を左右に配置します。
 */
defineProps<{
  label: string
  topBorder?: boolean
}>()
</script>

<template>
  <div class="c-result-details__row" :class="{ 'has-top-border': topBorder }">
    <dt>{{ label }}</dt>
    <dd><slot /></dd>
  </div>
</template>

<style scoped lang="scss">
.c-result-details__row {
  display: flex;
  align-items: center;
  justify-content: space-between;

  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);

  /* stylelint-disable-next-line selector-pseudo-class-no-unknown */
  :slotted(strong) {
    color: var(--color-text-main);
  }

  /* stylelint-disable-next-line selector-pseudo-class-no-unknown */
  :slotted(.c-badge) {
    flex-shrink: 0;
  }

  &.has-top-border {
    padding-top: var(--space-1);
    border-top: 1px solid var(--color-border);
  }
}
</style>
