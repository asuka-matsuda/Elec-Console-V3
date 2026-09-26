<script setup lang="ts">
/**
 * TableSoudenCircuit
 * [Portal Organisms] 送電試験（Phase 1〜3）専用の回路一覧テーブルコンポーネント。
 * 汎用 Table コンポーネントを基盤とし、回路記号・名称・測定者セルの既定描画と
 * 送電試験固有の行ステータス（完了・除外・ロック・編集行ハイライト）を提供します。
 */
import { useSlots, watch } from 'vue'

import type { CircuitItem } from '#shared/types/circuit'
import type { TableColumn, TableSortOrder } from '~/types/components'
import { formatShortDateTime } from '~/utils/date'

const sortBy = defineModel<string>('sortBy')
const sortOrder = defineModel<TableSortOrder>('sortOrder', { default: 'asc' })

const props = withDefaults(
  defineProps<{
    circuits: CircuitItem[]
    fullCircuits?: CircuitItem[]
    columns: TableColumn<CircuitItem>[]
    isCircuitLocked?: (circuit: CircuitItem) => boolean
    isComplete?: (circuit: CircuitItem) => boolean
    editingRowId?: string | null
    rowIdPrefix?: string
  }>(),
  {
    fullCircuits: undefined,
    isCircuitLocked: () => false,
    isComplete: () => false,
    editingRowId: null,
    rowIdPrefix: 'row-',
  },
)

const emit = defineEmits<{
  (e: 'sort', payload: { key: string, order: 'asc' | 'desc' | null }): void
}>()

defineSlots<{
  [K in `cell-${string}`]?: (props: { value: unknown, subValue?: unknown, row: CircuitItem, index: number, column: TableColumn<CircuitItem> }) => unknown
}>()

// 既存の @sort リスナーに対する後方互換性
watch([sortBy, sortOrder], ([newKey, newOrder]) => {
  emit('sort', { key: newKey || '', order: newOrder ?? null })
})

const slots = useSlots()

// 送電試験固有の行クラス生成
const getRowClass = (circuit: CircuitItem) => ({
  'is-completed': props.isComplete(circuit),
  'is-excluded': circuit.isExcluded,
  'is-locked': props.isCircuitLocked(circuit),
  'is-highlighted': props.editingRowId === circuit.id,
})

// スロットを提供する対象のカラム判定（親指定スロット または 送電試験標準セル）
const shouldProvideSlot = (colKey: string) => {
  return !!slots[`cell-${colKey}`]
    || colKey === 'kairoBangou'
    || colKey === 'kairoMeisho'
    || colKey.endsWith('ConfirmedAt')
}

// カラムキー（p1ConfirmedAt / p2ConfirmedAt / p3ConfirmedAt）に対応する作業者・日時の安全な解決
const getWorkerCellData = (circuit: CircuitItem, key: string) => {
  const prefix = key.replace('ConfirmedAt', '') // 'p1' | 'p2' | 'p3'
  const worker = circuit[`${prefix}Worker` as keyof CircuitItem] as string | null | undefined
  const confirmedAt = circuit[key as keyof CircuitItem] as string | null | undefined

  return { worker, confirmedAt }
}
</script>

<template>
  <Table
    v-model:sort-by="sortBy"
    v-model:sort-order="sortOrder"
    :columns="columns"
    :data="circuits"
    :full-data="fullCircuits"
    :row-id="(row) => `${rowIdPrefix}${row.id}`"
    :row-class="getRowClass"
    class="souden-circuit-table flex-1 min-h-[400px]"
  >

    <template
      v-for="col in columns.filter(c => shouldProvideSlot(String(c.key)))"
      :key="col.key"
      #[`cell-${col.key}`]="slotProps"
    >

      <slot
        v-if="$slots[`cell-${col.key}`]"
        :name="`cell-${col.key}`"
        v-bind="slotProps"
      />

      <div
        v-else-if="col.key === 'kairoBangou'"
        class="flex items-center justify-center"
      >
        <PortalCircuitSymbol
          :kigou="slotProps.row.kairoKigou"
          :bangou="slotProps.row.kairoBangou"
        />
      </div>

      <span
        v-else-if="col.key === 'kairoMeisho'"
        class="circuit-meisho block"
        :title="slotProps.row.kairoMeisho || ''"
      >
        {{ slotProps.row.kairoMeisho || '-' }}
      </span>

      <div
        v-else-if="col.key.endsWith('ConfirmedAt')"
        class="flex flex-col items-center gap-0.5"
      >
        <template v-if="getWorkerCellData(slotProps.row, col.key).worker">
          <span class="cell-worker">{{ getWorkerCellData(slotProps.row, col.key).worker }}</span>
          <span class="cell-date">{{ formatShortDateTime(getWorkerCellData(slotProps.row, col.key).confirmedAt) }}</span>
        </template>
        <span v-else class="cell-dash">-</span>
      </div>
    </template>
  </Table>
</template>

<style scoped lang="scss">
:deep(.table-row) {
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
  }
}

.circuit-meisho {
  font-size: inherit;
  font-weight: var(--font-weight-normal);
  line-height: 1.3;
  color: var(--color-text-main);
  white-space: pre-line;
}

:deep(td.col-actions),
:deep(th.col-actions) {
  width: 1%;
  white-space: nowrap;
}

.cell-worker {
  color: var(--color-status-success);
}

.cell-date {
  font-family: var(--font-mono);
  font-size: var(--font-size-2xs);
}

.cell-date,
.cell-dash {
  color: var(--color-text-muted);
}
</style>
