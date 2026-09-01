<script setup lang="ts">
/**
 * ToolResultDetails
 * 計算結果の詳細情報を行形式で表示するためのラッパーコンポーネントです。
 */
</script>

<template>
  <dl class="p-result-details">
    <slot />
  </dl>
</template>

<style scoped lang="scss">
.p-result-details {
  gap: var(--space-stack-gap-sm);
  margin: 0; // Reset dl margin
  padding-top: var(--space-card-pad-md);
  border-top: 1px solid var(--color-border);

  @include flex-start-stretch($direction: column);
}
</style>
