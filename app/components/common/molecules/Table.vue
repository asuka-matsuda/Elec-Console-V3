<script setup lang="ts" generic="T = unknown">
/**
 * Table
 * [Molecules] カラム定義とデータ配列を受け取り表示する汎用データテーブルコンポーネント。
 * - 動的列幅の自動最適化（useTableAutoWidth）
 * - 電気設備用語・英数字ハイフンの自動改行禁止制御（useNoBreakWords）
 * - <colgroup> による高効率な列幅一元管理（各tdへの重複スタイルを全廃）
 * - 骨格維持ローディング状態（スピナー/スケルトン）の標準内包
 * - 双方向ソートモデル（v-model:sortBy, v-model:sortOrder）
 * - ヘッダー（header-${col.key}）およびセル（cell-${col.key}）のスロット透過
 */
import { onMounted, ref } from 'vue'

import { useNoBreakWords } from '~/composables/useNoBreakWords'
import { useTableAutoWidth } from '~/composables/useTableAutoWidth'
import type { TableColumn, TableProps, TableSortOrder } from '~/types/components'

// v-model による双方向ソートバインディング (Vue 3.4+)
const sortBy = defineModel<string>('sortBy')
const sortOrder = defineModel<TableSortOrder>('sortOrder', { default: 'asc' })

const props = withDefaults(
  defineProps<Omit<TableProps<T>, 'sortBy' | 'sortOrder'>>(),
  {
    data: () => [],
    fullData: undefined,
    rowKey: 'id',
    rowClass: undefined,
    rowId: undefined,
    autoWidth: true,
    emptyText: 'データがありません',
    loading: false,
    loadingText: 'データを読み込み中...',
    interactiveRow: false,
  },
)

const emit = defineEmits<{
  (e: 'rowClick', payload: { row: T, index: number, event: MouseEvent }): void
}>()

defineSlots<{
  [K in `cell-${string}`]?: (props: { value: unknown, subValue?: unknown, row: T, index: number, column: TableColumn<unknown> }) => unknown
} & {
  [K in `header-${string}`]?: (props: { column: TableColumn<unknown> }) => unknown
} & {
  empty?: () => unknown
  loading?: () => unknown
}>()

// 改行禁止辞書の自動ロード（テーブル描画時に一度だけ確実に実行）
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

// ソート切り替えハンドラー（asc -> desc -> null サイクル）
const handleSort = (col: TableColumn<unknown>) => {
  if (col.sortable === false) return

  let nextOrder: TableSortOrder = 'asc'

  if (sortBy.value === col.key) {
    if (sortOrder.value === 'asc') {
      nextOrder = 'desc'
    }
    else if (sortOrder.value === 'desc') {
      nextOrder = null
    }
    else {
      nextOrder = 'asc'
    }
  }

  sortBy.value = nextOrder ? String(col.key) : undefined
  sortOrder.value = nextOrder
}

// 行クリックハンドラー
const handleRowClick = (row: T, index: number, event: MouseEvent) => {
  if (props.interactiveRow) {
    emit('rowClick', { row, index, event })
  }
}

// 一意な行キーの取得
const getRowKey = (row: T, index: number): string | number => {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row)
  }

  const record = row as Record<string, unknown> | null | undefined

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

// ネストプロパティ対応の安全なセル値取得関数
const getCellValue = (row: unknown, key?: string | number): unknown => {
  if (!row || !key || typeof row !== 'object') return undefined
  const record = row as Record<string, unknown>
  const keyStr = String(key)

  // 1. ドット記法によるネストパスアクセス
  if (keyStr.includes('.')) {
    const parts = keyStr.split('.')
    let current: unknown = record

    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined
      }
      current = (current as Record<string, unknown>)[part]
    }

    return current
  }

  // 2. 単一プロパティアクセス（未定義時は undefined）
  return record[keyStr]
}
</script>

<template>
  <div
    ref="tableWrapperRef"
    class="table-wrapper flex-1 min-h-0 overflow-auto"
  >
    <table class="w-full min-w-full table-fixed text-left">
      <!-- 列幅一元管理（各tdへの重複スタイルを全廃し描画パフォーマンス最大化） -->
      <colgroup>
        <col
          v-for="col in columns"
          :key="col.key"
          :style="{ width: columnWidthStyles[String(col.key)] }"
        />
      </colgroup>

      <thead>
        <tr>
          <TableTh
            v-for="col in columns"
            :key="col.key"
            :column="col"
            :sort-by="sortBy"
            :sort-order="sortOrder"
            @sort="handleSort"
          >
            <!-- ヘッダーカスタムスロット中継 -->
            <template v-if="$slots[`header-${col.key}`]" #default>
              <slot :name="`header-${col.key}`" :column="col" />
            </template>
          </TableTh>
        </tr>
      </thead>

      <!-- 1. ローディング表示（テーブル骨格とヘッダーを維持） -->
      <tbody v-if="loading">
        <tr>
          <td
            :colspan="columns.length"
            class="loading-cell py-12 text-center"
          >
            <slot name="loading">
              <div class="flex flex-col items-center justify-center gap-3">
                <Icon name="loader" size="lg" class="animate-spin text-accent" />
                <span class="loading-text">{{ loadingText }}</span>
              </div>
            </slot>
          </td>
        </tr>
      </tbody>

      <!-- 2. データ表示 -->
      <tbody v-else-if="data && data.length > 0">
        <tr
          v-for="(row, index) in data"
          :id="rowId?.(row, index)"
          :key="getRowKey(row, index)"
          class="table-row relative z-[1]"
          :class="[
            rowClass?.(row, index),
            { 'is-interactive': interactiveRow },
          ]"
          @click="handleRowClick(row, index, $event)"
        >
          <TableTd
            v-for="col in columns"
            :key="col.key"
            :value="getCellValue(row, col.key)"
            :sub-value="col.subKey ? getCellValue(row, col.subKey) : undefined"
            :align="col.align"
            :truncate="col.truncate"
            :empty-fallback="col.emptyFallback"
          >
            <template v-if="$slots[`cell-${col.key}`]" #default="{ value, subValue }">
              <slot
                :name="`cell-${col.key}`"
                :value="value"
                :sub-value="subValue"
                :row="row"
                :index="index"
                :column="col"
              />
            </template>
          </TableTd>
        </tr>
      </tbody>

      <!-- 3. 空データ表示 -->
      <tbody v-else>
        <tr>
          <td
            :colspan="columns.length"
            class="empty-cell py-12 text-center"
          >
            <slot name="empty">
              <EmptyState
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
.table-wrapper {
  border: var(--border-width-base) solid var(--color-border);
  background-color: var(--surface-bg);
  backdrop-filter: blur(var(--blur-sm));

  table {
    border-spacing: 0;
    border-collapse: separate;
  }
}

.table-row {
  transition: var(--transition-colors);

  @include state-interactive;

  &:hover {
    background:
      linear-gradient(
        to right,
        color-mix(in srgb, var(--theme-accent) 7%, transparent) 0%,
        color-mix(in srgb, var(--theme-accent) 1%, transparent) 40%,
        transparent 70%
      );
  }

  &:last-child {
    --table-cell-border-bottom: none;
  }
}

.text-accent {
  color: var(--theme-accent);
}

.loading-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
