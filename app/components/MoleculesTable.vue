<script setup lang="ts" generic="T = unknown">
/**
 * MoleculesTable
 * [Molecules] カラム定義とデータ配列を受け取り表示する純粋なデータテーブルコンポーネント。
 * データの最大文字長に応じた動的列幅の自動最適化と、コンテナ幅100%均等配分を提供します。
 */
import { onMounted, ref } from 'vue'

import { useNoBreakWords } from '~/composables/useNoBreakWords'
import { useTableAutoWidth } from '~/composables/useTableAutoWidth'
import type { TableColumn } from '~/types/components'

const props = withDefaults(
  defineProps<{
    columns: TableColumn<unknown>[]
    data?: T[]
    fullData?: T[]
    sortBy?: string
    sortOrder?: 'asc' | 'desc' | null
    rowKey?: string | ((row: T) => string | number)
    rowClass?: (row: T, index: number) => string | Record<string, boolean | undefined> | (string | Record<string, boolean | undefined>)[] | undefined
    rowId?: (row: T, index: number) => string
    autoWidth?: boolean
    emptyText?: string
  }>(),
  {
    data: () => [],
    fullData: undefined,
    sortBy: undefined,
    sortOrder: 'asc',
    rowKey: 'id',
    rowClass: undefined,
    rowId: undefined,
    autoWidth: true,
    emptyText: 'データがありません',
  },
)

const emit = defineEmits<{
  (e: 'sort', payload: { key: string, order: 'asc' | 'desc' | null }): void
}>()

defineSlots<{
  [K in `cell-${string}`]?: (props: { value: unknown, subValue?: unknown, row: T, index: number }) => unknown
} & {
  empty?: () => unknown
}>()

const { fetchWords } = useNoBreakWords()

onMounted(() => {
  fetchWords()
})

// テーブルコンテナ要素
const tableWrapperRef = ref<HTMLElement | null>(null)

// 列幅自動計算 Composable
const { columnWidthStyles } = useTableAutoWidth(tableWrapperRef, {
  columns: () => props.columns,
  data: () => props.data,
  fullData: () => props.fullData,
  autoWidth: () => props.autoWidth,
})

const handleSort = (col: TableColumn<unknown>) => {
  if (col.sortable === false) return

  let newOrder: 'asc' | 'desc' | null = 'asc'

  if (props.sortBy === col.key) {
    if (props.sortOrder === 'asc') {
      newOrder = 'desc'
    }
    else if (props.sortOrder === 'desc') {
      newOrder = null
    }
    else {
      newOrder = 'asc'
    }
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
  <div
    ref="tableWrapperRef"
    class="table-wrapper flex-1 min-h-0 overflow-y-auto"
  >
    <table class="w-full table-fixed text-left">
      <thead>
        <tr>
          <TableTh
            v-for="col in columns"
            :key="col.key"
            :column="col"
            :width="columnWidthStyles[String(col.key)]"
            :sort-by="sortBy"
            :sort-order="sortOrder"
            @sort="handleSort"
          />
        </tr>
      </thead>

      <tbody v-if="data && data.length > 0">
        <tr
          v-for="(row, index) in data"
          :id="rowId?.(row, index)"
          :key="getRowKey(row, index)"
          class="table-row relative z-[1]"
          :class="rowClass?.(row, index)"
        >
          <TableTd
            v-for="col in columns"
            :key="col.key"
            :column="col"
            :width="columnWidthStyles[String(col.key)]"
            :value="getCellValue(row, col.key)"
            :sub-value="col.subKey ? getCellValue(row, col.subKey) : undefined"
          >
            <template v-if="$slots[`cell-${col.key}`]" #default="{ value, subValue }">
              <slot
                :name="`cell-${col.key}`"
                :value="value"
                :sub-value="subValue"
                :row="row"
                :index="index"
              />
            </template>
          </TableTd>
        </tr>
      </tbody>
      <tbody v-else>
        <tr>
          <td
            :colspan="columns.length"
            class="empty-cell py-12 text-center"
          >
            <slot name="empty">
              <MoleculesEmptyState
                icon="database"
                :title="emptyText"
                class="py-4"
              />
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
table {
  border-spacing: 0;
  border-collapse: separate;
}

.table-wrapper {
  border: var(--border-width-base) solid var(--color-border);
  background-color: var(--surface-bg);
  backdrop-filter: blur(var(--blur-sm));
}

.table-row {
  transition: var(--transition-colors);

  &:hover {
    background-color: var(--color-bg-hover);
  }

  &:last-child {
    --table-cell-border-bottom: none;
  }
}
</style>
