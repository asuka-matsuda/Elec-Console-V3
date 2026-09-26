<script setup lang="ts">
/**
 * TablePhase1
 * [Portal Organisms] フェーズ1（回路確認・増締）の回路一覧テーブルコンポーネント。
 * チェックボックス（確認・増締）および常時入力可能な備考Textareaを備え、
 * 操作ボタンは「確定 / 解除」のみに特化。不備や特記事項は備考欄に記録します。
 */
import { toRef } from 'vue'

import type { CircuitItem } from '#shared/types/circuit'
import type { ConfirmPhase1Payload } from '~/composables/portal/phase/usePhase1Exam'
import { usePhaseTableForm } from '~/composables/portal/phase/usePhaseTableForm'
import { useTableSort } from '~/composables/useTableSort'
import { PHASE1_TABLE_COLUMNS } from '~/constants/soudenConstants'

interface Phase1RowForm {
  kakunin: boolean
  mashishime: boolean
  remarks: string
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

const initRowForm = (c: CircuitItem): Phase1RowForm => ({
  kakunin: Boolean(c.p1Kakunin),
  mashishime: Boolean(c.p1Mashishime),
  remarks: c.p1Remarks ?? '',
})

const {
  getRowForm,
  handleClearLocally,
  markConfirmedLocally,
  isConfirmed,
  isRowDisabled,
} = usePhaseTableForm<Phase1RowForm>({
  circuits: () => props.circuits,
  initForm: initRowForm,
  isConfirmedServer: c => Boolean(c.p1ConfirmedAt),
  isCircuitLocked: props.isCircuitLocked,
  isActionLoading: () => props.isActionLoading,
})

// ソート管理
const {
  sortBy,
  sortOrder,
  sortedData: sortedCircuits,
  handleSort,
} = useTableSort(toRef(props, 'circuits'))

// 確定ボタン押下時のみサーバーへの送信・確定処理を実行
const handleConfirm = (circuit: CircuitItem) => {
  const form = getRowForm(circuit)

  markConfirmedLocally(circuit)
  emit('confirm', circuit, {
    kakunin: form.kakunin,
    mashishime: form.mashishime,
    remarks: form.remarks,
  })
}

// 全相完了判定（確定済みであり、確認・増締の両方がチェックされていること）
const isComplete = (c: CircuitItem) => {
  if (!isConfirmed(c)) return false

  return Boolean(c.p1Kakunin && c.p1Mashishime)
}
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
