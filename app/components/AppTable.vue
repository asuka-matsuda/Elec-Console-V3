<script setup lang="ts" generic="T extends Record<string, any> = Record<string, any>">
/**
 * AppTable
 *
 * 汎用的なデータテーブル用コンポーネントです。
 * ヘッダー（th）のみglass-colorを使用し、ボディは透明。
 * 行（tr）ホバー時には発光エフェクト（ui-hover-glow）が適用されます。
 */

import type { TableColumn } from '~/types/components'

const props = withDefaults(
  defineProps<{
    columns?: TableColumn<T>[]
    data?: T[]
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    rowKey?: string | ((row: T) => string | number)
  }>(),
  {
    columns: undefined,
    data: undefined,
    sortBy: undefined,
    sortOrder: 'asc',
    rowKey: 'id',
  },
)

const emit = defineEmits<{
  (e: 'sort', payload: { key: string, order: 'asc' | 'desc' }): void
}>()

const handleSort = (col: TableColumn<T>) => {
  if (!col.sortable) return

  let newOrder: 'asc' | 'desc' = 'asc'

  if (props.sortBy === col.key) {
    newOrder = props.sortOrder === 'asc' ? 'desc' : 'asc'
  }
  emit('sort', { key: col.key, order: newOrder })
}

const getRowKey = (row: T, index: number): string | number => {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row)
  }

  if (props.rowKey && props.rowKey in row) {
    const value = row[props.rowKey]

    if (typeof value === 'string' || typeof value === 'number') {
      return value
    }
  }

  if ('id' in row) {
    const idValue = row.id

    if (typeof idValue === 'string' || typeof idValue === 'number') {
      return idValue
    }
  }

  return index
}
</script>

<template>
  <div class="table-wrapper">
    <table class="table">
      <thead v-if="$slots.header || columns">
        <slot name="header">
          <tr>
            <AppTableTh
              v-for="col in columns"
              :key="col.key"
              :column="col"
              :sort-by="sortBy"
              :sort-order="sortOrder"
              @sort="handleSort"
            />
          </tr>
        </slot>
      </thead>

      <tbody v-if="$slots.body || (data && columns)">
        <slot name="body">
          <tr v-for="(row, index) in data" :key="getRowKey(row, index)">
            <td
              v-for="col in columns"
              :key="col.key"
              :style="{ textAlign: col.align }"
            >
              <slot
                :name="`cell-${col.key}`"
                :value="row[col.key]"
                :row="row"
              >
                {{ row[col.key] }}
              </slot>
            </td>
          </tr>
        </slot>
      </tbody>

      <tfoot v-if="$slots.footer">
        <slot name="footer" />
      </tfoot>
    </table>
  </div>
</template>

<style scoped lang="scss">
.table-wrapper {
  overflow: auto;
  flex: 1;

  min-height: 0;
  border: var(--border-width-base) solid var(--color-border);
  border-radius: var(--radius-sm);

  background-color: var(--surface-bg);
  backdrop-filter: blur(var(--blur-sm));
}

.table {
  table-layout: fixed;
  border-spacing: 0;
  border-collapse: separate;

  width: 100%;

  text-align: left;

  th,
  :deep(th) {
    padding: var(--space-2);
    border-right: var(--border-width-base) solid var(--color-border);
    border-bottom: calc(var(--border-width-base) * 2) solid var(--color-border);

    white-space: nowrap;
    vertical-align: middle;
  }

  td,
  :deep(td) {
    overflow: hidden;

    padding: var(--space-2);
    border-right: var(--border-width-base) solid var(--color-border);
    border-bottom: var(--border-width-base) solid
      color-mix(in srgb, var(--color-border) 70%, var(--color-text-muted) 30%);

    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: middle;
  }

  th:last-child,
  td:last-child,
  :deep(th:last-child),
  :deep(td:last-child) {
    border-right: none;
  }

  td,
  :deep(td) {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-text-main);
  }

  tbody tr,
  :deep(tbody tr) { /* Required for z-index and box-shadow to appear correctly on rows */
    position: relative;
    z-index: 1;
    transition: var(--transition-base);

    &:hover {
      z-index: 1;
      background-color: var(--color-bg-hover);
      transition: background-color var(--duration-fast) var(--ease-base);
    }
  }

  tbody tr:last-child td,
  :deep(tbody tr:last-child td) {
    border-bottom: none;
  }
}
</style>
