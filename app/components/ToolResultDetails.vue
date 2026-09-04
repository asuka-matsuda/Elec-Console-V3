<script setup lang="ts">
/**
 * ToolResultDetails
 * 計算結果の詳細情報を行形式で表示するためのラッパーコンポーネントです。
 */
</script>

<template>
  <dl class="c-result-details">
    <slot />
  </dl>
</template>

<style scoped lang="scss">
.c-result-details {
  @include flex-start-stretch($direction: column);

  gap: var(--space-1);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
}
</style>
