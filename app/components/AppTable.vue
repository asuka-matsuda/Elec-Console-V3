<script setup lang="ts" generic="T extends Record<string, unknown>">
/**
 * AppTable
 *
 * 汎用的なデータテーブル用コンポーネントです。
 * ヘッダー（th）のみglass-colorを使用し、ボディは透明。
 * 行（tr）ホバー時には発光エフェクト（ui-hover-glow）が適用されます。
 */

export interface TableColumn<T = Record<string, unknown>> {
  key: (keyof T & string) | string
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

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
  <div class="c-table-wrapper">
    <table class="c-table">
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
.c-table-wrapper {
  overflow: auto;
  flex: 1;
  min-height: 0;

  @include border-base;
}

.c-table {
  border-spacing: 0;
  border-collapse: separate;
  width: 100%;
  text-align: left;

  th,
  td {
    padding: var(--space-2) var(--space-3);
    border-bottom: var(--border-width-base) solid var(--color-border);
    white-space: nowrap;
    vertical-align: middle;
  }

  td {
    @include text-mono;
  }

  tbody tr {
    position: relative; /* Required for z-index and box-shadow to appear correctly on rows */

    @include state-base;

    &:last-child td {
      border-bottom: none;
    }

    &:hover {
      z-index: 1;
      outline: var(--border-width-base) solid
        color-mix(in srgb, var(--theme-accent) 80%, transparent);
      outline-offset: calc(var(--border-width-base) * -1);

      @include state-hover;
    }
  }
}
</style>
