<script setup lang="ts">
/**
 * PortalPhase2Table
 * [Portal Organisms] フェーズ2（絶縁抵抗測定・メガ測定）の回路一覧テーブルコンポーネント。
 * 回路情報の表示、手入力モード（R/S/T相の測定値入力）、全相OK確定（100MΩ）、および解除操作を管理します。
 */
import { reactive, ref, toRef } from 'vue'

import { useTableSort } from '~/composables/useTableSort'
import { PHASE2_TABLE_COLUMNS } from '~/constants/soudenConstants'
import type { CircuitItem } from '~/types/souden'

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

// 相ラベルの取得（三相: R-S / S-T / R-T, 単相: R-N / T-N / R-T）
const getPhaseLabels = (circuit: CircuitItem) => {
  if (props.isThreePhase(circuit)) {
    return {
      phase1: 'R - S',
      phase2: 'S - T',
      phase3: 'R - T',
    }
  }

  return {
    phase1: 'R - N',
    phase2: 'T - N',
    phase3: 'R - T',
  }
}

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

const parseVal = (val: string | number): number | null => {
  if (val === '' || val == null) return null
  const num = typeof val === 'number' ? val : Number(val)

  return Number.isNaN(num) ? null : num
}

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
  <PortalSoudenCircuitTable
    class="flex-1 min-h-[400px]"
    :columns="PHASE2_TABLE_COLUMNS"
    :circuits="sortedCircuits"
    :full-circuits="fullCircuits || circuits"
    :sort-by="sortBy"
    :sort-order="sortOrder"
    :is-circuit-locked="(circuit) => isCircuitLocked(circuit) || !isP1Complete(circuit)"
    :is-complete="isComplete"
    :editing-row-id="editingRowId"
    @sort="handleSort"
  >
    <!-- 測定相 1 (R-S / R-N) -->
    <template #cell-zetsuenR="{ row: circuit }">
      <PortalPhase2MeasCell
        v-model="inputForm.rVal"
        :label="getPhaseLabels(circuit).phase1"
        :val="circuit.zetsuenR"
        :status="circuit.p2RStatus"
        :is-editing="editingRowId === circuit.id"
        :threshold="phase2ThresholdMegOhm"
        @enter="saveInput(circuit)"
      />
    </template>

    <!-- 測定相 2 (S-T / T-N) -->
    <template #cell-zetsuenS="{ row: circuit }">
      <PortalPhase2MeasCell
        v-model="inputForm.sVal"
        :label="getPhaseLabels(circuit).phase2"
        :val="circuit.zetsuenS"
        :status="circuit.p2SStatus"
        :is-editing="editingRowId === circuit.id"
        :threshold="phase2ThresholdMegOhm"
        @enter="saveInput(circuit)"
      />
    </template>

    <!-- 測定相 3 (R-T / R-T) -->
    <template #cell-zetsuenT="{ row: circuit }">
      <PortalPhase2MeasCell
        v-model="inputForm.tVal"
        :label="getPhaseLabels(circuit).phase3"
        :val="circuit.zetsuenT"
        :status="circuit.p2TStatus"
        :is-editing="editingRowId === circuit.id"
        :threshold="phase2ThresholdMegOhm"
        @enter="saveInput(circuit)"
      />
    </template>

    <!-- 備考 -->
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

    <!-- 操作 -->
    <template #cell-actions="{ row: circuit }">
      <div class="flex items-center justify-center gap-1">
        <!-- 幹線未完了による操作不可 -->
        <template v-if="isCircuitLocked(circuit)">
          <span class="text-note inline-flex items-center gap-1">⏸ 幹線未完了</span>
        </template>

        <!-- 前フェーズ（P1）未完了による操作不可 -->
        <template v-else-if="!isP1Complete(circuit)">
          <span class="text-note inline-flex items-center gap-1">⏸ P1未了</span>
        </template>

        <!-- 手入力編集モード中 -->
        <template v-else-if="editingRowId === circuit.id">
          <Button
            variant="success"
            :loading="isActionLoading[circuit.id]"
            @click="saveInput(circuit)"
          >
            確定
          </Button>
          <Button
            @click="cancelInput"
          >
            取消
          </Button>
        </template>

        <!-- 通常モード：確定済み -->
        <template v-else-if="isComplete(circuit)">
          <Button
            variant="danger"
            :loading="isActionLoading[circuit.id]"
            @click="$emit('clear', circuit)"
          >
            解除
          </Button>
          <Button
            @click="startInput(circuit)"
          >
            変更
          </Button>
        </template>

        <!-- 通常モード：未確定 -->
        <template v-else>
          <Button
            variant="success"
            :disabled="circuit.isExcluded"
            :loading="isActionLoading[circuit.id]"
            @click="handleQuickOk(circuit)"
          >
            全相OK
          </Button>
          <Button
            :disabled="circuit.isExcluded"
            @click="startInput(circuit)"
          >
            測定入力
          </Button>
        </template>
      </div>
    </template>
  </PortalSoudenCircuitTable>
</template>

<style scoped lang="scss">
.cell-remarks {
  overflow: hidden;
  display: block;

  max-width: 100%;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-note {
  font-size: inherit;
  font-weight: var(--font-weight-normal);
  color: var(--color-status-warning);
}
</style>
