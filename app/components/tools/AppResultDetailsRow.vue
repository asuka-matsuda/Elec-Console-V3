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
  // --- 継承 ---
  @extend %text-sm;

  // --- レイアウト・配置 ---
  display: flex;
  justify-content: space-between;

  // --- タイポグラフィ ---
  color: var(--color-text-secondary);
  
  // --- 子要素 ---
  /* stylelint-disable-next-line selector-pseudo-class-no-unknown */
  :slotted(strong) {
    // --- タイポグラフィ ---
    color: var(--color-text-main);
  }

  /* stylelint-disable-next-line selector-pseudo-class-no-unknown */
  :slotted(.p-badge) {
    // --- レイアウト・配置 ---
    flex-shrink: 0;
  }

  // --- モディファイア ---
  &.has-top-border {
    // --- ボックスモデル ---
    padding-top: var(--gap-element);
    border-top: 1px solid var(--color-border);
  }
}
</style>
