<script setup lang="ts">
/**
 * TablePhase2
 * [Portal Organisms] フェーズ2（絶縁抵抗測定・メガ測定）の回路一覧テーブルコンポーネント。
 * - 各測定欄・備考欄は最初から常時Input/Textareaを表示
 * - 「全相OK」は入力補助（各相Inputに100を代入、サーバー送信・測定者記録は確定まで行わない）
 * - 各相一部のみの入力でも確定可能（3相すべてOKの場合のみフェーズ3解禁: p2IsComplete=true）
 * - 確定後はすべてdisabled化、解除するまで編集不可
 * - 解除ボタンはサーバー送信せずローカルで編集可能状態に戻す（入力値は保持）
 */
import { toRef } from 'vue'

import type { CircuitItem } from '#shared/types/circuit'
import { isPhase1Complete } from '#shared/utils/soudenExam'
import { usePhaseTableForm } from '~/composables/portal/phase/usePhaseTableForm'
import { useTableSort } from '~/composables/useTableSort'
import { PHASE2_TABLE_COLUMNS } from '~/constants/soudenConstants'
import {
  getCircuitPhaseLabels,
  getPhase2Threshold,
  parseNullableNumber,
} from '~/utils/souden'

interface Phase2RowForm {
  rVal: string | number
  sVal: string | number
  tVal: string | number
  remarks: string
}

const props = defineProps<{
  circuits: CircuitItem[]
  fullCircuits?: CircuitItem[]
  isCircuitLocked: (circuit: CircuitItem) => boolean
  isActionLoading: Record<string, boolean>
  isThreePhase: (circuit: CircuitItem) => boolean
  phase2ThresholdMegOhm?: number
  evalMegStatus?: (val: number | null | undefined) => 'OK' | 'NG' | null
}>()

const emit = defineEmits<{
  confirm: [
    circuit: CircuitItem,
    values: {
      rVal: number | null
      sVal: number | null
      tVal: number | null
      rStatus: string
      sStatus: string
      tStatus: string
      remarks?: string
      isComplete: boolean
    },
  ]
}>()

const isP1Complete = (circuit: CircuitItem) => isPhase1Complete(circuit)
const isLocked = (circuit: CircuitItem) => props.isCircuitLocked(circuit) || !isP1Complete(circuit)

const initRowForm = (circuit: CircuitItem): Phase2RowForm => ({
  rVal: circuit.zetsuenR != null ? circuit.zetsuenR : '',
  sVal: circuit.zetsuenS != null ? circuit.zetsuenS : '',
  tVal: circuit.zetsuenT != null ? circuit.zetsuenT : '',
  remarks: circuit.p2Remarks ?? '',
})

const {
  getRowForm,
  handleClearLocally,
  markConfirmedLocally,
  isConfirmed,
  isRowDisabled,
} = usePhaseTableForm<Phase2RowForm>({
  circuits: () => props.circuits,
  initForm: initRowForm,
  isConfirmedServer: c => Boolean(c.p2ConfirmedAt),
  isCircuitLocked: isLocked,
  isActionLoading: () => props.isActionLoading,
})

// ソート管理
const {
  sortBy,
  sortOrder,
  sortedData: sortedCircuits,
  handleSort,
} = useTableSort(toRef(props, 'circuits'))

// 完了判定（確定済みであり、かつ3相すべてOKで完了していること）
const isComplete = (circuit: CircuitItem) => {
  if (!isConfirmed(circuit)) return false

  return Boolean(circuit.p2IsComplete)
}

// 相ラベルの取得（三相: R-S / S-T / R-T, 単相: R-N / T-N / R-T）
const getPhaseLabels = (circuit: CircuitItem) => getCircuitPhaseLabels(props.isThreePhase(circuit))

// 「全相OK」クリック時：各相Inputに100を代入（サーバー送信・確定は行わない）
const handleFillAllOk = (circuit: CircuitItem) => {
  const form = getRowForm(circuit)

  form.rVal = 100
  form.sVal = 100
  form.tVal = 100
}

// 「確定」クリック時：サーバーへの送信と測定者の記録を実行
const handleConfirm = (circuit: CircuitItem) => {
  const form = getRowForm(circuit)
  const rNum = parseNullableNumber(form.rVal)
  const sNum = parseNullableNumber(form.sVal)
  const tNum = parseNullableNumber(form.tVal)

  const threshold = getPhase2Threshold(circuit.haidenHoushiki)
  const evalStatus = (val: number | null) => (val == null ? null : (val >= threshold ? 'OK' : 'NG'))
  const rStatus = evalStatus(rNum)
  const sStatus = evalStatus(sNum)
  const tStatus = evalStatus(tNum)

  // 3列すべてに値があり、かつ3相すべてがOKの場合のみフェーズ3解禁 (isComplete: true)
  const isAllOk = rStatus === 'OK' && sStatus === 'OK' && tStatus === 'OK'

  markConfirmedLocally(circuit)

  emit('confirm', circuit, {
    rVal: rNum,
    sVal: sNum,
    tVal: tNum,
    rStatus: rStatus || '',
    sStatus: sStatus || '',
    tStatus: tStatus || '',
    remarks: form.remarks,
    isComplete: isAllOk,
  })
}
</script>

<template>
  <PortalTableSoudenCircuit
    class="flex-1 min-h-[400px]"
    :columns="PHASE2_TABLE_COLUMNS"
    :circuits="sortedCircuits"
    :full-circuits="fullCircuits || circuits"
    :sort-by="sortBy"
    :sort-order="sortOrder"
    :is-circuit-locked="isLocked"
    :is-complete="isComplete"
    @sort="handleSort"
  >
    <template #cell-zetsuenR="{ row: circuit }">
      <PortalCellPhaseMeas
        v-model="getRowForm(circuit).rVal"
        :label="getPhaseLabels(circuit).phase1"
        :status="isConfirmed(circuit) ? circuit.p2RStatus : null"
        :disabled="isRowDisabled(circuit)"
        :haiden-houshiki="circuit.haidenHoushiki"
        @enter="handleConfirm(circuit)"
      />
    </template>

    <template #cell-zetsuenS="{ row: circuit }">
      <PortalCellPhaseMeas
        v-model="getRowForm(circuit).sVal"
        :label="getPhaseLabels(circuit).phase2"
        :status="isConfirmed(circuit) ? circuit.p2SStatus : null"
        :disabled="isRowDisabled(circuit)"
        :haiden-houshiki="circuit.haidenHoushiki"
        @enter="handleConfirm(circuit)"
      />
    </template>

    <template #cell-zetsuenT="{ row: circuit }">
      <PortalCellPhaseMeas
        v-model="getRowForm(circuit).tVal"
        :label="getPhaseLabels(circuit).phase3"
        :status="isConfirmed(circuit) ? circuit.p2TStatus : null"
        :disabled="isRowDisabled(circuit)"
        :haiden-houshiki="circuit.haidenHoushiki"
        @enter="handleConfirm(circuit)"
      />
    </template>

    <template #cell-p2Remarks="{ row: circuit }">
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
        :is-locked="isLocked(circuit)"
        :locked-reason="isCircuitLocked(circuit) ? '幹線未完了' : 'P1未了'"
        :is-completed="isConfirmed(circuit)"
        :is-loading="Boolean(isActionLoading[circuit.id])"
        @confirm="handleConfirm(circuit)"
        @clear="handleClearLocally(circuit)"
      >
        <Button
          variant="default"
          :disabled="circuit.isExcluded || Boolean(isActionLoading[circuit.id])"
          @click="handleFillAllOk(circuit)"
        >
          全相OK
        </Button>
      </PortalCellSoudenActions>
    </template>
  </PortalTableSoudenCircuit>
</template>

<style scoped lang="scss">
.textarea-remarks {
  resize: vertical;
  font-size: var(--font-size-xs);
}
</style>
