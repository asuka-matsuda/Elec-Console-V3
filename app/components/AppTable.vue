<script setup lang="ts">
/**
 * AppTable
 * 
 * 汎用的なデータテーブル用コンポーネントです。
 * ヘッダー（th）のみglass-colorを使用し、ボディは透明。
 * 行（tr）ホバー時には発光エフェクト（ui-hover-glow）が適用されます。
 */
</script>

<template>
  <div class="c-table-wrapper">
    <table class="c-table">
      <thead v-if="$slots.header">
        <slot name="header" />
      </thead>
      <tbody v-if="$slots.body">
        <slot name="body" />
      </tbody>
      <tfoot v-if="$slots.footer">
        <slot name="footer" />
      </tfoot>
    </table>
  </div>
</template>

<style scoped lang="scss">
.c-table-wrapper {
  width: 100%;
  overflow-x: auto;
  border: var(--border-width-base) solid var(--color-border-base);
  
  // Custom scrollbar provided by global mixin if needed, or inline here
  &::-webkit-scrollbar {
    height: var(--space-2);
  }
  &::-webkit-scrollbar-thumb {
    background-color: transparent;
    box-shadow: inset 0 0 0 var(--border-width-base) var(--color-border-base);
  }
  &::-webkit-scrollbar-track {
    background-color: transparent;
  }
}

.c-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  text-align: left;
  
  :deep(th),
  :deep(td) {
    padding: var(--space-3) var(--space-4);
    border-bottom: var(--border-width-base) solid var(--color-border-base);
    color: var(--color-text-main);
    vertical-align: middle;
  }

  :deep(th) {
    background-color: glass-color(15%);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    white-space: nowrap;
    border-bottom-width: calc(var(--border-width-base) * 2);
  }

  :deep(tbody tr) {
    transition: var(--transition-base);
    position: relative; // Required for z-index and box-shadow to appear correctly on rows

    &:last-child td {
      border-bottom: none;
    }

    &:hover {
      z-index: 1;
      // テーブル行ホバー時の発光エフェクト
      @include ui-hover-glow(var(--color-category-main));
      // 行全体を光らせるため、セルの背景を上書きさせない
      outline: var(--border-width-base) solid theme-color(var(--color-category-main), 80%);
      outline-offset: calc(var(--border-width-base) * -1);
    }
  }
}
</style>
