<script setup lang="ts">
/**
 * AppResultDetailsRow
 * 計算結果の詳細情報の各行を表示するコンポーネントです。ラベルと値を左右に配置します。
 */
defineProps<{
  label: string;
  topBorder?: boolean;
}>();
</script>

<template>
  <div class="p-result-details__row" :class="{ 'has-top-border': topBorder }">
    <span>{{ label }}</span>
    <span><slot /></span>
  </div>
</template>

<style scoped lang="scss">
.p-result-details__row {
  // --- Base Styles ---
  @extend %text-sm;

  display: flex;
  justify-content: space-between;
  color: var(--color-text-secondary);
  
  /* stylelint-disable-next-line selector-pseudo-class-no-unknown */
  :slotted(strong) {
    color: var(--color-text-main);
  }

  /* stylelint-disable-next-line selector-pseudo-class-no-unknown */
  :slotted(.p-badge) {
    flex-shrink: 0;
  }

  // --- State Modifiers ---
  &.has-top-border {
    padding-top: var(--gap-element);
    border-top: 1px solid var(--color-border);
  }
}
</style>
