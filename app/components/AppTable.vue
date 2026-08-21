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
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: var(--border-width-base) solid var(--color-border);
}

.c-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  text-align: left;

  :deep(th),
  :deep(td) {
    padding: var(--space-3);
    border-bottom: var(--border-width-base) solid var(--color-border);
    color: var(--color-text-main);
    vertical-align: middle;
    white-space: nowrap;
  }

  :deep(td) {
    font-family: var(--font-mono);
  }

  :deep(th) {
    position: sticky;
    top: 0;
    z-index: 2;
    backdrop-filter: blur(var(--blur-md));
    font-weight: var(--font-weight-bold);
    color: var(--color-text-muted);

    @extend %text-sm;

    border-bottom-width: calc(var(--border-width-base) * 2);
  }

  :deep(tbody tr) {
    transition: var(--transition-base);
    position: relative; /* Required for z-index and box-shadow to appear correctly on rows */

    &:last-child td {
      border-bottom: none;
    }

    &:hover {
      z-index: 1;

      /* テーブル行ホバー時の発光エフェクト */
      @include ui-hover-glow;

      /* 行全体を光らせるため、セルの背景を上書きさせない */
      outline: var(--border-width-base) solid
        theme-color(var(--color-category-main), 80%);
      outline-offset: calc(var(--border-width-base) * -1);
    }
  }
}
</style>
