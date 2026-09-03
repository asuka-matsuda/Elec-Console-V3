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
  <div class="p-result-details__row" :class="{ 'has-top-border': topBorder }">
    <dt>{{ label }}</dt>
    <dd><slot /></dd>
  </div>
</template>

<style scoped lang="scss">
.p-result-details__row {
  @include text-desc;
  @include flex-between-center;

  color: var(--color-text-secondary);

  /* stylelint-disable-next-line selector-pseudo-class-no-unknown */
  :slotted(strong) {
    color: var(--color-text-main);
  }

  /* stylelint-disable-next-line selector-pseudo-class-no-unknown */
  :slotted(.p-badge) {
    flex-shrink: 0;
  }

  &.has-top-border {
    padding-top: var(--space-1);
    border-top: 1px solid var(--color-border);
  }
}

dt,
dd {
  margin: 0;
}
</style>
