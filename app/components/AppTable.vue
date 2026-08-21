<script setup lang="ts" generic="T extends Record<string, unknown>">
/**
 * AppTable
 *
 * 汎用的なデータテーブル用コンポーネントです。
 * ヘッダー（th）のみglass-colorを使用し、ボディは透明。
 * 行（tr）ホバー時には発光エフェクト（ui-hover-glow）が適用されます。
 */

export interface TableColumn {
  key: string;
  label: string;
}

defineProps<{
  columns?: TableColumn[];
  data?: T[];
}>();
</script>

<template>
  <div class="c-table-wrapper">
    <table class="c-table">
      <!-- 従来の手書き用スロットまたはcolumns propによる自動生成 -->
      <thead v-if="$slots.header || columns">
        <slot name="header">
          <tr v-if="columns">
            <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
          </tr>
        </slot>
      </thead>

      <!-- 従来の手書き用スロットまたはdata propによる自動生成 -->
      <tbody v-if="$slots.body || (data && columns)">
        <slot name="body">
          <template v-if="data && columns">
            <tr v-for="(row, index) in data" :key="index">
              <td v-for="col in columns" :key="col.key">
                <slot
                  :name="`cell-${col.key}`"
                  :value="row[col.key]"
                  :row="row"
                >
                  {{ row[col.key] }}
                </slot>
              </td>
            </tr>
          </template>
        </slot>
      </tbody>

      <tfoot v-if="$slots.footer">
        <slot name="footer" />
      </tfoot>
    </table>
  </div>
</template>

<style scoped lang="scss">
.c-table-wrapper {
  // --- Base Styles ---
  overflow: auto;
  flex: 1;

  width: 100%;
  min-height: 0;
  border: var(--border-width-base) solid var(--color-border);
}

.c-table {
  border-spacing: 0;
  border-collapse: separate;
  width: 100%;
  text-align: left;

  :deep(th),
  :deep(td) {
    padding: var(--space-3);
    border-bottom: var(--border-width-base) solid var(--color-border);

    color: var(--color-text-main);
    white-space: nowrap;
    vertical-align: middle;
  }

  :deep(td) {
    font-family: var(--font-mono);
  }

  :deep(th) {

    @extend %text-sm;

    position: sticky;
    z-index: 2;
    top: 0;

    border-bottom-width: calc(var(--border-width-base) * 2);

    font-weight: var(--font-weight-bold);
    color: var(--color-text-muted);

    backdrop-filter: blur(var(--blur-md));
  }

  :deep(tbody tr) {
    position: relative; /* Required for z-index and box-shadow to appear correctly on rows */
    transition: var(--transition-base);

    &:last-child td {
      border-bottom: none;
    }

    &:hover {
      z-index: 1;

      /* テーブル行ホバー時の発光エフェクト */
      @include hover-glow;

      /* 行全体を光らせるため、セルの背景を上書きさせない */
      outline: var(--border-width-base) solid
        theme-color(var(--color-category-main), 80%);
      outline-offset: calc(var(--border-width-base) * -1);
    }
  }
}
</style>
