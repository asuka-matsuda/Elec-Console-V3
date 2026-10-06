<script setup lang="ts" generic="T = Record<string, unknown>">
/**
 * Table (Geist準拠)
 * [Molecules] カラム定義とデータ配列を受け取り表示する汎用データテーブルコンポーネント。
 * - ブラウザネイティブの table-layout による高速描画
 * - <colgroup> による高効率な列幅一元管理
 * - 生 <th> / <td> による直接描画（Atoms層のオーバーヘッドを全廃）
 * - ソートのオプトイン方式（sortable: true のみ有効）
 * - 双方向ソートモデル（v-model:sortBy, v-model:sortOrder）
 * - ヘッダー（header-${col.key}）およびセル（cell-${col.key}）のスロット透過
 * - 直角（border-radius: 0）サイバーサーフェス
 * - 支援アクセシビリティ属性（aria-*, role）はプロジェクト規約により除外
 */
import type { TableColumn, TableProps, TableSortOrder } from '~/types/components'
import { getTableCellValue, getTableRowKey } from '~/utils/table'

// v-model による双方向ソートバインディング (Vue 3.4+)
const sortBy = defineModel<string>('sortBy')
const sortOrder = defineModel<TableSortOrder>('sortOrder', { default: 'asc' })

const props = withDefaults(
  defineProps<Omit<TableProps<T>, 'sortBy' | 'sortOrder'>>(),
  {
    data: () => [],
    rowKey: 'id',
    emptyText: 'データがありません',
    loading: false,
    loadingText: 'データを読み込み中...',
    skeletonRows: 5,
    interactiveRow: false,
  },
)

const emit = defineEmits<{
  (e: 'rowClick', payload: { row: T, index: number, event: MouseEvent }): void
}>()

defineSlots<{
  [K in `cell-${string}`]?: (props: { value: unknown, row: T, index: number, column: TableColumn<T> }) => unknown
} & {
  [K in `header-${string}`]?: (props: { column: TableColumn<T> }) => unknown
} & {
  empty?: () => unknown
  loading?: () => unknown
}>()

// ソート可否：カラムで明示的に sortable: true が指定されている場合のみ有効（オプトイン）
const isSortable = (col: TableColumn<T>) => Boolean(col.key && col.sortable === true)

// ソート切り替えハンドラー（asc -> desc -> null サイクル）
const handleSort = (col: TableColumn<T>) => {
  if (!isSortable(col)) return

  const nextOrder: TableSortOrder = sortBy.value === col.key
    ? (sortOrder.value === 'asc' ? 'desc' : sortOrder.value === 'desc' ? null : 'asc')
    : 'asc'

  sortBy.value = nextOrder ? String(col.key) : undefined
  sortOrder.value = nextOrder
}

// 行クリックハンドラー
const handleRowClick = (row: T, index: number, event: MouseEvent) => {
  if (props.interactiveRow) {
    emit('rowClick', { row, index, event })
  }
}

const getRowKey = (row: T, index: number) => getTableRowKey(row, index, props.rowKey)
const getCellValue = (row: unknown, key?: string | number) => getTableCellValue(row, key)

const getCellDisplayValue = (row: T, col: TableColumn<T>): unknown => {
  const val = getCellValue(row, col.key)

  if (val === null || val === undefined || val === '') {
    return col.emptyFallback ?? '-'
  }

  return col.format ? col.format(val, row) : val
}
</script>

<template>
  <div class="table-wrapper overflow-auto">
    <table class="min-w-full text-left" :class="{ 'table-fixed': columns.some(c => c.width) }">
      <colgroup>
        <col v-for="col in columns" :key="col.key" :style="{ width: col.width }" />
      </colgroup>

      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key" class="sticky top-0 z-table-header p-item-gap align-middle" :class="{ 'is-sortable': isSortable(col), 'is-sorted': sortBy === col.key && sortOrder }" @click="handleSort(col)">
            <div class="flex items-center gap-inline-gap w-full min-w-0" :class="col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : 'justify-start'">
              <span class="header-label">
                <slot :name="`header-${col.key}`" :column="col">
                  {{ col.label }}
                </slot>
              </span>
              <Icon v-if="isSortable(col)" :name="sortBy === col.key && sortOrder ? (sortOrder === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevrons-up-down'" size="sm" class="sort-icon" :class="{ 'is-active': sortBy === col.key && sortOrder }" />
            </div>
          </th>
        </tr>
      </thead>

      <tbody v-if="loading">
        <slot name="loading">
          <tr v-for="skeletonIndex in skeletonRows" :key="`skeleton-row-${skeletonIndex}`" class="table-row">
            <td v-for="col in columns" :key="`skeleton-col-${String(col.key)}`" class="p-item-gap align-middle" :class="[col.class, col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left']">
              <Skeleton :width="col.align === 'center' ? '40%' : '75%'" height="1.1rem" />
            </td>
          </tr>
        </slot>
      </tbody>

      <tbody v-else-if="data && data.length > 0">
        <tr v-for="(row, index) in data" :id="rowId?.(row, index)" :key="getRowKey(row, index)" class="table-row relative z-[1]" :class="[rowClass?.(row, index), { 'is-interactive': interactiveRow }]" @click="handleRowClick(row, index, $event)">
          <td v-for="col in columns" :key="col.key" class="p-item-gap align-middle" :class="[col.class, col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left', { 'is-truncate': col.truncate, 'is-empty': getCellValue(row, col.key) === null || getCellValue(row, col.key) === undefined || getCellValue(row, col.key) === '' }]">
            <slot v-if="$slots[`cell-${col.key}`]" :name="`cell-${col.key}`" :value="getCellValue(row, col.key)" :row="row" :index="index" :column="col" />
            <template v-else>
              {{ getCellDisplayValue(row, col) }}
            </template>
          </td>
        </tr>
      </tbody>

      <tbody v-else>
        <tr>
          <td :colspan="columns.length" class="empty-cell text-center">
            <slot name="empty">
              <EmptyState icon="database" size="sm" :title="emptyText" />
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
  border-radius: 0;
  background-color: var(--surface-bg);
  backdrop-filter: blur(var(--blur-sm));

  table {
    border-spacing: 0;
    border-collapse: separate;
  }
}

// ヘッダーセル
th {
  height: var(--table-cell-min-height, 36px);
  border-right: var(--border-width-base) solid var(--color-border);
  border-bottom: var(--border-width-thick) solid var(--color-border);

  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text-secondary);
  white-space: nowrap;

  background-color: var(--surface-bg-elevated);
  backdrop-filter: blur(var(--blur-md));

  &:last-child {
    border-right: none;
  }

  &.is-sortable {
    transition: var(--transition-colors);

    @include state-interactive;

    &:hover {
      color: var(--color-text-main);

      .sort-icon:not(.is-active) {
        opacity: 0.85;
      }
    }
  }

  &.is-sorted {
    border-bottom-color: var(--theme-accent);
    color: var(--color-text-main);
  }

  .header-label {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sort-icon {
    color: var(--color-text-muted);
    opacity: 0.45;
    transition: var(--transition-fast);

    &.is-active {
      color: var(--theme-accent);
      opacity: 1;
    }
  }
}

// データセル
td {
  height: var(--table-cell-min-height, 36px);
  border-right: var(--border-width-base) solid var(--color-border);
  border-bottom: var(
    --table-cell-border-bottom,
    var(--border-width-base) solid color-mix(in srgb, var(--color-border) 70%, var(--color-text-muted) 30%)
  );

  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-normal, 400);
  font-variant-numeric: tabular-nums;
  line-height: var(--table-cell-line-height, 1.3);
  color: var(--color-text-main);
  word-break: auto-phrase;
  line-break: strict;
  overflow-wrap: anywhere;

  &:last-child {
    border-right: none;
  }

  &.is-empty {
    color: var(--color-text-muted);
  }

  &.is-truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.table-row {
  transition: var(--transition-colors);

  &.is-interactive {
    @include state-interactive {
      &:hover {
        background:
          linear-gradient(
            to right,
            color-mix(in srgb, var(--theme-accent) 7%, transparent) 0%,
            color-mix(in srgb, var(--theme-accent) 1%, transparent) 40%,
            transparent 70%
          );
      }

      &:active {
        background-color: color-mix(in srgb, var(--theme-accent) 10%, transparent);
      }
    }
  }

  &.is-completed {
    background-color: var(--color-completed-row-bg);
  }

  &.is-excluded {
    opacity: 0.5;
  }

  &.is-locked {
    opacity: 0.6;
  }

  &.is-highlighted {
    background-color: var(--color-selection-bg);
    outline: 2px solid var(--color-selection-outline);
    animation: row-pulse-highlight 2.5s ease-out;
  }

  &:last-child td {
    --table-cell-border-bottom: none;
  }
}

th.col-actions,
td.col-actions {
  width: 1%;
  white-space: nowrap;
}

@keyframes row-pulse-highlight {
  0% {
    outline-color: var(--color-status-success);
    box-shadow: inset 0 0 0 2px var(--color-status-success), 0 0 14px color-mix(in srgb, var(--color-status-success) 45%, transparent);
  }

  50% {
    outline-color: var(--color-selection-outline);
    box-shadow: inset 0 0 0 1px var(--color-selection-outline);
  }

  100% {
    outline-color: var(--color-selection-outline);
    box-shadow: none;
  }
}

.loading-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.loading-cell,
.empty-cell {
  color: var(--color-text-muted);
}
</style>
