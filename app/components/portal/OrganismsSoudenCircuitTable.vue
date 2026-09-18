<script setup lang="ts">
/**
 * OrganismsSoudenCircuitTable
 * 送電試験（Phase 1〜3）専用の回路一覧テーブルコンポーネント。
 * 回路記号SVG（PortalAtomsKairoSymbol）専用列の完全保護、行ステータス装飾、
 * 測定者/日時セルの標準内包、および各フェーズ固有の測定・操作スロットを提供します。
 */
import { onMounted, ref } from 'vue'

import { useNoBreakWords } from '~/composables/useNoBreakWords'
import { useTableAutoWidth } from '~/composables/useTableAutoWidth'
import type { TableColumn } from '~/types/components'
import type { CircuitItem } from '~/types/souden'

const props = withDefaults(
  defineProps<{
    circuits: CircuitItem[]
    fullCircuits?: CircuitItem[]
    columns: TableColumn<CircuitItem>[]
    sortBy?: string
    sortOrder?: 'asc' | 'desc' | null
    isCircuitLocked?: (circuit: CircuitItem) => boolean
    isComplete?: (circuit: CircuitItem) => boolean
    editingRowId?: string | null
    rowIdPrefix?: string
  }>(),
  {
    fullCircuits: undefined,
    sortBy: undefined,
    sortOrder: 'asc',
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
  [K in `cell-${string}`]?: (props: { value: unknown, subValue?: unknown, row: CircuitItem, index: number }) => unknown
}>()

const { fetchWords } = useNoBreakWords()

onMounted(() => {
  fetchWords()
})

const tableWrapperRef = ref<HTMLElement | null>(null)

// 送電試験用テーブルでも文字数自動推計と余剰均等分配 Composable を活用
const { columnWidthStyles } = useTableAutoWidth(tableWrapperRef, {
  columns: () => props.columns,
  data: () => props.circuits,
  fullData: () => props.fullCircuits || props.circuits,
  autoWidth: true,
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

const getCellValue = (row: CircuitItem, key: string): unknown => {
  if (!row || typeof row !== 'object') return undefined

  return (row as Record<string, unknown>)[key]
}
</script>

<template>
  <div
    ref="tableWrapperRef"
    class="souden-circuit-table flex-1 min-h-[400px] overflow-y-auto"
  >
    <table class="w-full table-fixed text-left">
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
          />
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="(circuit, index) in circuits"
          :id="`${rowIdPrefix}${circuit.id}`"
          :key="circuit.id"
          class="circuit-row relative z-[1]"
          :class="{
            'is-completed': isComplete(circuit),
            'is-excluded': circuit.isExcluded,
            'is-locked': isCircuitLocked(circuit),
            'is-highlighted': editingRowId === circuit.id,
          }"
        >
          <TableTd
            v-for="col in columns"
            :key="col.key"
            :value="getCellValue(circuit, col.key)"
            :sub-value="col.subKey ? getCellValue(circuit, col.subKey) : undefined"
            :align="col.align"
            :truncate="col.truncate"
            :empty-fallback="col.emptyFallback"
          >
            <template #default="{ value, subValue }">
              <!-- カスタムスロットがあれば最優先で描画 -->
              <slot
                v-if="$slots[`cell-${col.key}`]"
                :name="`cell-${col.key}`"
                :value="value"
                :sub-value="subValue"
                :row="circuit"
                :index="index"
              />

              <!-- 回路番号の送電試験標準描画（スロット指定がない場合） -->
              <div
                v-else-if="col.key === 'kairoBangou'"
                class="flex items-center justify-center"
              >
                <PortalAtomsKairoSymbol
                  :kigou="circuit.kairoKigou"
                  :bangou="circuit.kairoBangou"
                />
              </div>

              <!-- 回路名称の送電試験標準描画（スロット指定がない場合・Excel改行を保持） -->
              <span
                v-else-if="col.key === 'kairoMeisho'"
                class="circuit-meisho block"
                :title="circuit.kairoMeisho || ''"
              >
                {{ circuit.kairoMeisho || '-' }}
              </span>

              <!-- 測定者/日時の送電試験標準描画（スロット指定がない場合） -->
              <PortalMoleculesSoudenWorkerCell
                v-else-if="col.key.endsWith('ConfirmedAt')"
                :worker="circuit.p3Worker || circuit.p2Worker || circuit.p1Worker"
                :confirmed-at="circuit.p3ConfirmedAt || circuit.p2ConfirmedAt || circuit.p1ConfirmedAt"
              />
            </template>
          </TableTd>
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

.souden-circuit-table {
  border: var(--border-width-base) solid var(--color-border);
  background-color: var(--surface-bg);
  backdrop-filter: blur(var(--blur-sm));
}

.circuit-row {
  transition: var(--transition-interactive);

  &:hover {
    background-color: var(--color-bg-hover);
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
  }

  &:last-child {
    --table-cell-border-bottom: none;
  }
}

.circuit-meisho {
  font-size: inherit;
  font-weight: var(--font-weight-normal);
  line-height: 1.3;
  color: var(--color-text-main);
  white-space: pre-line;
}
</style>
