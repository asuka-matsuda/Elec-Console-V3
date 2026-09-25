<script setup lang="ts">
/**
 * TablePhase1
 * [Portal Organisms] フェーズ1（回路確認・増締）の回路一覧テーブルコンポーネント。
 * チェックボックス（確認・増締）および常時入力可能な備考Textareaを備え、
 * 操作ボタンは「確定 / 解除」のみに特化。不備や特記事項は備考欄に記録します。
 */
import { reactive, ref, toRef, watch } from 'vue'

import type { ConfirmPhase1Payload } from '~/composables/portal/phase/usePhase1Exam'
import { useTableSort } from '~/composables/useTableSort'
import { PHASE1_TABLE_COLUMNS } from '~/constants/soudenConstants'
import type { CircuitItem } from '~/types/souden'

export interface Phase1RowForm {
  kakunin: boolean
  mashishime: boolean
  remarks: string
}

export type RowCheckState = Pick<Phase1RowForm, 'kakunin' | 'mashishime'>

const props = defineProps<{
  circuits: CircuitItem[]
  fullCircuits?: CircuitItem[]
  isCircuitLocked: (circuit: CircuitItem) => boolean
  isActionLoading: Record<string, boolean>
}>()

const emit = defineEmits<{
  confirm: [circuit: CircuitItem, overrideData?: ConfirmPhase1Payload]
}>()

// 各行の入力フォーム状態（確認・増締・備考）
const rowForms = reactive<Record<string, Phase1RowForm>>({})
// ローカルで解除された行IDのセット（確定ボタンを押すまでサーバーへは送信しない）
const unconfirmedRowIds = ref<Set<string>>(new Set())

const initRowForm = (c: CircuitItem): Phase1RowForm => ({
  kakunin: Boolean(c.p1Kakunin),
  mashishime: Boolean(c.p1Mashishime),
  remarks: c.p1Remarks ?? '',
})

const getRowForm = (circuit: CircuitItem): Phase1RowForm => {
  if (!rowForms[circuit.id]) {
    rowForms[circuit.id] = initRowForm(circuit)
  }

  return rowForms[circuit.id]!
}

// サーバーから回路一覧がフェッチされた際（確定後・リロード時）にローカル状態を最新値に同期
watch(
  () => props.circuits,
  (newCircuits) => {
    unconfirmedRowIds.value.clear()
    for (const c of newCircuits) {
      rowForms[c.id] = initRowForm(c)
    }
  },
  { immediate: true },
)

// 解除ボタンクリック時：サーバー送信は行わず、UI上で解除状態にして確定ボタンに戻す（値は保持）
const handleClearLocally = (circuit: CircuitItem) => {
  unconfirmedRowIds.value.add(circuit.id)
}

// 確定ボタン押下時のみサーバーへの送信・確定処理を実行
const handleConfirm = (circuit: CircuitItem) => {
  const form = getRowForm(circuit)

  unconfirmedRowIds.value.delete(circuit.id)
  emit('confirm', circuit, {
    kakunin: form.kakunin,
    mashishime: form.mashishime,
    remarks: form.remarks,
  })
}

// 確定済み表示判定（ローカル解除されておらず、確定日時があること）
const isConfirmed = (c: CircuitItem) => {
  if (unconfirmedRowIds.value.has(c.id)) return false

  return Boolean(c.p1ConfirmedAt)
}

// 全相完了判定（確定済みであり、確認・増締の両方がチェックされていること）
const isComplete = (c: CircuitItem) => {
  if (!isConfirmed(c)) return false

  return Boolean(c.p1Kakunin && c.p1Mashishime)
}

// 行の入力無効判定（確定済み、幹線ロック中、除外回路、またはアクション実行中）
const isRowDisabled = (c: CircuitItem) => {
  return isConfirmed(c)
    || props.isCircuitLocked(c)
    || Boolean(props.isActionLoading[c.id])
    || Boolean(c.isExcluded)
}

// ソート管理
const {
  sortBy,
  sortOrder,
  sortedData: sortedCircuits,
  handleSort,
} = useTableSort(toRef(props, 'circuits'))
</script>

<template>
  <PortalTableSoudenCircuit
    class="flex-1 min-h-[400px]"
    :columns="PHASE1_TABLE_COLUMNS"
    :circuits="sortedCircuits"
    :full-circuits="fullCircuits || circuits"
    :sort-by="sortBy"
    :sort-order="sortOrder"
    :is-circuit-locked="isCircuitLocked"
    :is-complete="isComplete"
    @sort="handleSort"
  >
    <template #cell-cableList="{ row: circuit }">
      <div class="flex flex-col gap-0.5">
        <div class="flex items-center gap-1">
          <span class="cell-cable">{{ circuit.cableList || '-' }}</span>
          <span v-if="circuit.haisenJousuu" class="cell-jousuu">({{ circuit.haisenJousuu }})</span>
        </div>
        <span class="cell-setsuchi" :title="circuit.setsuchiList || ''">
          {{ circuit.setsuchiList ? `E: ${circuit.setsuchiList}` : '-' }}
        </span>
      </div>
    </template>

    <template #cell-p1Kakunin="{ row: circuit }">
      <div class="flex items-center justify-center gap-3">
        <Checkbox
          v-model="getRowForm(circuit).kakunin"
          label="確認"
          :disabled="isRowDisabled(circuit)"
        />
        <Checkbox
          v-model="getRowForm(circuit).mashishime"
          label="増締"
          :disabled="isRowDisabled(circuit)"
        />
      </div>
    </template>

    <template #cell-p1Remarks="{ row: circuit }">
      <Textarea
        v-model="getRowForm(circuit).remarks"
        :rows="1"
        auto-resize
        placeholder="備考"
        class="w-full textarea-remarks"
        :disabled="isRowDisabled(circuit)"
      />
    </template>

    <template #cell-actions="{ row: circuit }">
      <PortalCellSoudenActions
        :circuit="circuit"
        :is-locked="isCircuitLocked(circuit)"
        locked-reason="幹線未完了"
        :is-completed="isConfirmed(circuit)"
        :is-loading="isActionLoading[circuit.id]"
        @confirm="handleConfirm(circuit)"
        @clear="handleClearLocally(circuit)"
      />
    </template>
  </PortalTableSoudenCircuit>
</template>

<style scoped lang="scss">
.cell-cable {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-main);
}

.cell-jousuu {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.cell-setsuchi {
  overflow: hidden;

  max-width: 140px;

  font-size: var(--font-size-2xs);
  color: var(--color-text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.textarea-remarks {
  font-size: var(--font-size-xs);
}
</style>
