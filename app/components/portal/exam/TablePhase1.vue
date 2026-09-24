<script setup lang="ts">
/**
 * TablePhase1
 * [Portal Organisms] フェーズ1（回路確認・増締）の回路一覧テーブルコンポーネント。
 * チェックボックス（確認・増締）および常時入力可能な備考Textareaを備え、
 * 操作ボタンは「確定 / 解除」のみに特化。不備や特記事項は備考欄に記録します。
 */
import { reactive, toRef, watch } from 'vue'

import type { ConfirmPhase1Payload } from '~/composables/portal/phase/usePhase1Exam'
import { useTableSort } from '~/composables/useTableSort'
import { PHASE1_TABLE_COLUMNS } from '~/constants/soudenConstants'
import type { CircuitItem } from '~/types/souden'

export interface RowCheckState {
  kakunin: boolean
  mashishime: boolean
}

const props = defineProps<{
  circuits: CircuitItem[]
  fullCircuits?: CircuitItem[]
  isCircuitLocked: (circuit: CircuitItem) => boolean
  isActionLoading: Record<string, boolean>
}>()

const emit = defineEmits<{
  confirm: [circuit: CircuitItem, overrideData?: ConfirmPhase1Payload]
}>()

// 各行のチェックボックス状態（確定ボタンを押すまでUI上のみで保持）
const rowChecks = reactive<Record<string, RowCheckState>>({})
// 各行の備考テキスト（常時表示Textareaで入力、確定ボタン押下時に送信）
const rowRemarks = reactive<Record<string, string>>({})
// ローカルで解除された行IDのマップ（確定ボタンを押すまでサーバーへは送信しない）
const locallyUnconfirmedMap = reactive<Record<string, boolean>>({})

const initRowCheck = (c: CircuitItem): RowCheckState => ({
  kakunin: Boolean(c.p1Kakunin),
  mashishime: Boolean(c.p1Mashishime),
})

const getRowCheck = (circuit: CircuitItem): RowCheckState => {
  let state = rowChecks[circuit.id]

  if (!state) {
    state = initRowCheck(circuit)
    rowChecks[circuit.id] = state
  }

  return state
}

const getRowRemarks = (circuit: CircuitItem): string => {
  return rowRemarks[circuit.id] ?? circuit.p1Remarks ?? ''
}

const handleUpdateRemarks = (circuit: CircuitItem, val: string) => {
  rowRemarks[circuit.id] = val
}

// サーバーから回路一覧がフェッチされた際（確定後・リロード時）にローカル状態を最新値に同期
watch(
  () => props.circuits,
  (newCircuits) => {
    for (const c of newCircuits) {
      locallyUnconfirmedMap[c.id] = false
      rowChecks[c.id] = initRowCheck(c)
      rowRemarks[c.id] = c.p1Remarks || ''
    }
  },
  { immediate: true },
)

// チェックボックスはUI上のオン/オフのみ（API通信は行わず測定者・日時は上書きしない）
const handleToggleKakunin = (circuit: CircuitItem, val: boolean) => {
  const current = getRowCheck(circuit)

  current.kakunin = val
}

const handleToggleMashishime = (circuit: CircuitItem, val: boolean) => {
  const current = getRowCheck(circuit)

  current.mashishime = val
}

// 解除ボタンクリック時：サーバー送信は行わず、UI上で解除状態にして確定ボタンに戻す（値は保持）
const handleClearLocally = (circuit: CircuitItem) => {
  locallyUnconfirmedMap[circuit.id] = true
}

// 確定ボタン押下時のみサーバーへの送信・確定処理を実行
const handleConfirm = (circuit: CircuitItem) => {
  const current = getRowCheck(circuit)
  const remarks = getRowRemarks(circuit)

  locallyUnconfirmedMap[circuit.id] = false
  emit('confirm', circuit, {
    kakunin: current.kakunin,
    mashishime: current.mashishime,
    remarks,
  })
}

// 確定済み表示判定（ローカル解除されておらず、確定日時があること）
const isConfirmed = (c: CircuitItem) => {
  if (locallyUnconfirmedMap[c.id]) return false

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
          :model-value="getRowCheck(circuit).kakunin"
          label="確認"
          :disabled="isRowDisabled(circuit)"
          @update:model-value="handleToggleKakunin(circuit, Boolean($event))"
        />
        <Checkbox
          :model-value="getRowCheck(circuit).mashishime"
          label="増締"
          :disabled="isRowDisabled(circuit)"
          @update:model-value="handleToggleMashishime(circuit, Boolean($event))"
        />
      </div>
    </template>

    <template #cell-p1Remarks="{ row: circuit }">
      <Textarea
        :model-value="getRowRemarks(circuit)"
        :rows="1"
        auto-resize
        placeholder="備考"
        class="w-full textarea-remarks"
        :disabled="isRowDisabled(circuit)"
        @update:model-value="handleUpdateRemarks(circuit, String($event ?? ''))"
      />
    </template>

    <template #cell-actions="{ row: circuit }">
      <PortalCellSoudenActions
        :circuit="circuit"
        :is-locked="isCircuitLocked(circuit)"
        locked-reason="幹線未完了"
        :is-completed="isConfirmed(circuit)"
        :is-loading="isActionLoading[circuit.id]"
        :has-edit-button="false"
        :has-modify-button="false"
        confirm-label="確定"
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
