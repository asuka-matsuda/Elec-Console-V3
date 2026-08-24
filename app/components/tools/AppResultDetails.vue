<script setup lang="ts">
/**
 * AppResultDetails
 * 計算結果の詳細情報を行形式で表示するためのラッパーコンポーネントです。
 */
</script>

<template>
  <div class="p-result-details">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.p-result-details {
  // --- Base Styles ---
  @include flex-column(var(--gap-element));

  padding-top: var(--gap-section);
  border-top: 1px solid var(--color-border);
}
</style>
