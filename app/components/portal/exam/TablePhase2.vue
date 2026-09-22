<script setup lang="ts">
/**
 * PortalTablePhase2
 * [Portal Organisms] フェーズ2（絶縁抵抗測定・メガ測定）の回路一覧テーブルコンポーネント。
 * 回路情報の表示、手入力モード（R/S/T相の測定値入力）、全相OK確定（100MΩ）、および解除操作を管理します。
 */
import { reactive, ref, toRef } from 'vue'

import { useTableSort } from '~/composables/useTableSort'
import { PHASE2_TABLE_COLUMNS } from '~/constants/soudenConstants'
import type { CircuitItem } from '~/types/souden'
import { getCircuitPhaseLabels, parseNullableNumber } from '~/utils/souden'

const props = defineProps<{
  circuits: CircuitItem[]
  fullCircuits?: CircuitItem[]
  isCircuitLocked: (circuit: CircuitItem) => boolean
  isActionLoading: Record<string, boolean>
  isThreePhase: (circuit: CircuitItem) => boolean
  phase2ThresholdMegOhm: number
  evalMegStatus: (val: number | null | undefined) => 'OK' | 'NG' | null
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
  clear: [circuit: CircuitItem]
}>()

// 各行の手入力・編集状態
const editingRowId = ref<string | null>(null)
const inputForm = reactive({
  rVal: '' as string | number,
  sVal: '' as string | number,
  tVal: '' as string | number,
  remarks: '',
})

const isComplete = (circuit: CircuitItem) => Boolean(circuit.p2ConfirmedAt && circuit.p2IsComplete)
const isP1Complete = (circuit: CircuitItem) => Boolean(circuit.p1ConfirmedAt)
const isLocked = (circuit: CircuitItem) => props.isCircuitLocked(circuit) || !isP1Complete(circuit)

// 相ラベルの取得（三相: R-S / S-T / R-T, 単相: R-N / T-N / R-T）
const getPhaseLabels = (circuit: CircuitItem) => getCircuitPhaseLabels(props.isThreePhase(circuit))

// クイック全相OK確定（100MΩ）
const handleQuickOk = (circuit: CircuitItem) => {
  emit('confirm', circuit, {
    rVal: 100,
    sVal: 100,
    tVal: 100,
    rStatus: 'OK',
    sStatus: 'OK',
    tStatus: 'OK',
    isComplete: true,
  })
}

// 手入力モードの開始
const startInput = (circuit: CircuitItem) => {
  editingRowId.value = circuit.id
  inputForm.rVal = circuit.zetsuenR ?? 100
  inputForm.sVal = circuit.zetsuenS ?? 100
  inputForm.tVal = circuit.zetsuenT ?? 100
  inputForm.remarks = circuit.p2Remarks ?? ''
}

const cancelInput = () => {
  editingRowId.value = null
}

const parseVal = parseNullableNumber

// 手入力内容の確定
const saveInput = (circuit: CircuitItem) => {
  const rNum = parseVal(inputForm.rVal)
  const sNum = parseVal(inputForm.sVal)
  const tNum = parseVal(inputForm.tVal)

  const rStatus = props.evalMegStatus(rNum)
  const sStatus = props.evalMegStatus(sNum)
  const tStatus = props.evalMegStatus(tNum)

  const isAllOk = rStatus === 'OK' && sStatus === 'OK' && tStatus === 'OK'

  emit('confirm', circuit, {
    rVal: rNum,
    sVal: sNum,
    tVal: tNum,
    rStatus: rStatus || '',
    sStatus: sStatus || '',
    tStatus: tStatus || '',
    remarks: inputForm.remarks,
    isComplete: isAllOk,
  })

  editingRowId.value = null
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
    :columns="PHASE2_TABLE_COLUMNS"
    :circuits="sortedCircuits"
    :full-circuits="fullCircuits || circuits"
    :sort-by="sortBy"
    :sort-order="sortOrder"
    :is-circuit-locked="isLocked"
    :is-complete="isComplete"
    :editing-row-id="editingRowId"
    @sort="handleSort"
  >

    <template #cell-zetsuenR="{ row: circuit }">
      <PortalCellPhaseMeas
        v-model="inputForm.rVal"
        :label="getPhaseLabels(circuit).phase1"
        :val="circuit.zetsuenR"
        :status="circuit.p2RStatus"
        :is-editing="editingRowId === circuit.id"
        :threshold="phase2ThresholdMegOhm"
        @enter="saveInput(circuit)"
      />
    </template>

    <template #cell-zetsuenS="{ row: circuit }">
      <PortalCellPhaseMeas
        v-model="inputForm.sVal"
        :label="getPhaseLabels(circuit).phase2"
        :val="circuit.zetsuenS"
        :status="circuit.p2SStatus"
        :is-editing="editingRowId === circuit.id"
        :threshold="phase2ThresholdMegOhm"
        @enter="saveInput(circuit)"
      />
    </template>

    <template #cell-zetsuenT="{ row: circuit }">
      <PortalCellPhaseMeas
        v-model="inputForm.tVal"
        :label="getPhaseLabels(circuit).phase3"
        :val="circuit.zetsuenT"
        :status="circuit.p2TStatus"
        :is-editing="editingRowId === circuit.id"
        :threshold="phase2ThresholdMegOhm"
        @enter="saveInput(circuit)"
      />
    </template>

    <template #cell-p2Remarks="{ row: circuit }">
      <Textarea
        v-if="editingRowId === circuit.id"
        v-model="inputForm.remarks"
        :rows="2"
        placeholder="備考"
      />
      <span v-else class="cell-remarks" :title="circuit.p2Remarks || ''">
        {{ circuit.p2Remarks || '-' }}
      </span>
    </template>

    <template #cell-actions="{ row: circuit }">
      <PortalCellSoudenActions
        :circuit="circuit"
        :is-locked="isLocked(circuit)"
        :locked-reason="isCircuitLocked(circuit) ? '幹線未完了' : 'P1未了'"
        :is-editing="editingRowId === circuit.id"
        :is-completed="isComplete(circuit)"
        :is-loading="isActionLoading[circuit.id]"
        confirm-label="全相OK"
        edit-label="測定入力"
        save-label="確定"
        @confirm="handleQuickOk(circuit)"
        @clear="$emit('clear', circuit)"
        @edit="startInput(circuit)"
        @save="saveInput(circuit)"
        @cancel="cancelInput"
      />
    </template>
  </PortalTableSoudenCircuit>
</template>
