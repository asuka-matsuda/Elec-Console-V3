<script setup lang="ts" generic="T = unknown">
/**
 * MoleculesTable
 * [Molecules] カラム定義とデータ配列を受け取り表示する純粋なデータテーブルコンポーネント。
 */
import type { TableColumn } from '~/types/components'

const props = withDefaults(
  defineProps<{
    columns: TableColumn<unknown>[]
    data?: T[]
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    rowKey?: string | ((row: T) => string | number)
    rowClass?: (row: T, index: number) => string | Record<string, boolean | undefined> | (string | Record<string, boolean | undefined>)[] | undefined
    rowId?: (row: T, index: number) => string
  }>(),
  {
    data: () => [],
    sortBy: undefined,
    sortOrder: 'asc',
    rowKey: 'id',
    rowClass: undefined,
    rowId: undefined,
  },
)

const emit = defineEmits<{
  (e: 'sort', payload: { key: string, order: 'asc' | 'desc' }): void
}>()

defineSlots<{
  [K in `cell-${string}`]?: (props: { value: unknown, row: T, index: number }) => unknown
}>()

const handleSort = (col: TableColumn<unknown>) => {
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

  const record = row as Record<string, unknown>

  if (props.rowKey && record && props.rowKey in record) {
    const value = record[props.rowKey]

    if (typeof value === 'string' || typeof value === 'number') {
      return value
    }
  }

  if (record && 'id' in record) {
    const idValue = record.id

    if (typeof idValue === 'string' || typeof idValue === 'number') {
      return idValue
    }
  }

  return index
}

const getCellValue = (row: T, key: string): unknown => {
  if (!row || typeof row !== 'object') return undefined

  return (row as Record<string, unknown>)[key]
}
</script>

<template>
  <div class="table-wrapper flex-1 min-h-0 overflow-auto">
    <table class="w-full table-fixed text-left border-separate border-spacing-0">
      <thead>
        <tr>
          <AtomsTableTh
            v-for="col in columns"
            :key="col.key"
            :column="col"
            :sort-by="sortBy"
            :sort-order="sortOrder"
            @sort="handleSort"
          />
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="(row, index) in data"
          :id="rowId?.(row, index)"
          :key="getRowKey(row, index)"
          class="table-row relative z-[1]"
          :class="rowClass?.(row, index)"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            class="table-cell p-2 truncate align-middle"
            :style="{ textAlign: col.align }"
          >
            <slot
              :name="`cell-${col.key}`"
              :value="getCellValue(row, col.key)"
              :row="row"
              :index="index"
            >
              {{ getCellValue(row, col.key) }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.table-wrapper {
  border: var(--border-width-base) solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--surface-bg);
  backdrop-filter: blur(var(--blur-sm));
}

.table-row {
  transition: var(--transition-colors);

  &:hover {
    background-color: var(--color-bg-hover);
  }

  &:last-child .table-cell {
    border-bottom: none;
  }
}

.table-cell {
  border-right: var(--border-width-base) solid var(--color-border);
  border-bottom: var(--border-width-base) solid
    color-mix(in srgb, var(--color-border) 70%, var(--color-text-muted) 30%);

  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  color: var(--color-text-main);

  &:last-child {
    border-right: none;
  }
}
</style>
