<script setup lang="ts">
/**
 * TablePhase3
 * [Portal Organisms] フェーズ3（送電・電圧測定・検相）の回路一覧テーブルコンポーネント。
 * - 各電圧欄・備考欄・検相欄は最初から常時Input/Select/Textareaを表示
 * - 操作列は確定ボタンのみを配置（確定時のみサーバー送信＆測定者記録、確定前は保持・送信しない）
 * - 確定後はすべてdisabled化、解除するまで編集不可
 * - 解除ボタンはサーバー送信せずローカルで編集可能状態に戻す（入力値は保持）
 * - 配電方式を参照し、各相の測定値が±10%の範囲外の場合はエラーを表示し確定不可
 * - 検相が「否」（単相）または「逆」（三相）の場合は確定しても進捗させない（isComplete: false）
 */
import { toRef } from 'vue'

import type { CircuitItem } from '#shared/types/circuit'
import { isPhase2Complete } from '#shared/utils/soudenExam'
import { usePhaseTableForm } from '~/composables/portal/phase/usePhaseTableForm'
import { useTableSort } from '~/composables/useTableSort'
import {
  KENSOU_OPTIONS_1P,
  KENSOU_OPTIONS_3P,
  PHASE3_TABLE_COLUMNS,
} from '~/constants/soudenConstants'
import type { SelectOption } from '~/types/components'
import {
  getCircuitPhaseLabels,
  getPhase3VoltageRanges,
  isPhase3KensouPass,
  isVoltageOutOfRange,
  parseNullableNumber,
} from '~/utils/souden'

interface Phase3RowForm {
  rs: string | number
  st: string | number
  rt: string | number
  kensou: string
  remarks: string
}

const props = defineProps<{
  circuits: CircuitItem[]
  fullCircuits?: CircuitItem[]
  isCircuitLocked: (circuit: CircuitItem) => boolean
  isActionLoading: Record<string, boolean>
  isThreePhase: (circuit: CircuitItem) => boolean
}>()

const emit = defineEmits<{
  confirm: [
    circuit: CircuitItem,
    values: {
      rs: number | null
      st: number | null
      rt: number | null
      kensou: string
      remarks?: string
      isComplete: boolean
    },
  ]
}>()

const isP2Complete = (circuit: CircuitItem) => isPhase2Complete(circuit)
const isLocked = (circuit: CircuitItem) => props.isCircuitLocked(circuit) || !isP2Complete(circuit)

const initRowForm = (circuit: CircuitItem): Phase3RowForm => {
  const isThree = props.isThreePhase(circuit)

  let initialKensou = circuit.kensou

  if (!initialKensou) {
    initialKensou = isThree ? '正' : '良'
  }
  else if (initialKensou === '正相') {
    initialKensou = '正'
  }
  else if (initialKensou === '逆相') {
    initialKensou = '逆'
  }
  else if (initialKensou === '点灯確認(良)') {
    initialKensou = '良'
  }
  else if (initialKensou === '点灯確認(否)') {
    initialKensou = '否'
  }

  return {
    rs: circuit.denatsuRs != null ? circuit.denatsuRs : '',
    st: circuit.denatsuSt != null ? circuit.denatsuSt : '',
    rt: circuit.denatsuRt != null ? circuit.denatsuRt : '',
    kensou: initialKensou,
    remarks: circuit.p3Remarks ?? '',
  }
}

const {
  getRowForm,
  handleClearLocally,
  markConfirmedLocally,
  isConfirmed,
  isRowDisabled,
} = usePhaseTableForm<Phase3RowForm>({
  circuits: () => props.circuits,
  initForm: initRowForm,
  isConfirmedServer: c => Boolean(c.p3ConfirmedAt),
  isCircuitLocked: isLocked,
  isActionLoading: () => props.isActionLoading,
})

// ソート管理
const {
  sortBy,
  sortOrder,
  sortedData: sortedCircuits,
} = useTableSort(toRef(props, 'circuits'))

// 完了判定（確定済みであり、かつ p3IsComplete が true）
const isComplete = (circuit: CircuitItem) => {
  if (!isConfirmed(circuit)) return false

  return Boolean(circuit.p3IsComplete)
}

// 相ラベルの取得（三相: R-S / S-T / R-T, 単相: R-N / T-N / R-T）
const getPhaseLabels = (circuit: CircuitItem) => getCircuitPhaseLabels(props.isThreePhase(circuit))

// 電圧許容範囲の取得（配電方式・三相判定から±10%範囲を取得）
const getVoltageRanges = (circuit: CircuitItem) => {
  return getPhase3VoltageRanges(circuit.haidenHoushiki, props.isThreePhase(circuit))
}

// 検相セレクトの選択肢
const getKensouOptions = (circuit: CircuitItem): SelectOption[] => {
  return props.isThreePhase(circuit) ? KENSOU_OPTIONS_3P : KENSOU_OPTIONS_1P
}

// 電圧±10%範囲外エラーがあるかの判定（入力されている値のうち1つでも範囲外があればtrue）
const hasVoltageOutOfRangeError = (circuit: CircuitItem): boolean => {
  const form = getRowForm(circuit)
  const ranges = getVoltageRanges(circuit)

  return isVoltageOutOfRange(form.rs, ranges.phase1)
    || isVoltageOutOfRange(form.st, ranges.phase2)
    || isVoltageOutOfRange(form.rt, ranges.phase3)
}

// 「確定」クリック時：サーバーへの送信と測定者の記録を実行
const handleConfirm = (circuit: CircuitItem) => {
  if (hasVoltageOutOfRangeError(circuit)) return

  const form = getRowForm(circuit)
  const rsNum = parseNullableNumber(form.rs)
  const stNum = parseNullableNumber(form.st)
  const rtNum = parseNullableNumber(form.rt)
  const isThree = props.isThreePhase(circuit)

  // 検相合格判定（単相なら「良」、三相なら「正」）
  const isKensouOk = isPhase3KensouPass(form.kensou, isThree)

  // 電圧範囲チェック
  const ranges = getVoltageRanges(circuit)
  const isVoltageOk = rsNum !== null && !isVoltageOutOfRange(rsNum, ranges.phase1)
    && stNum !== null && !isVoltageOutOfRange(stNum, ranges.phase2)
    && rtNum !== null && !isVoltageOutOfRange(rtNum, ranges.phase3)

  // 電圧がすべて正常範囲内 かつ 検相が「良/正」の場合のみ進捗（完了）とする
  // 「否」や「逆」の場合は進捗させない（isComplete: false）
  const isAllComplete = isKensouOk && isVoltageOk

  markConfirmedLocally(circuit)

  emit('confirm', circuit, {
    rs: rsNum,
    st: stNum,
    rt: rtNum,
    kensou: form.kensou,
    remarks: form.remarks,
    isComplete: isAllComplete,
  })
}
</script>

<template>
  <PortalTableSoudenCircuit
    v-model:sort-by="sortBy"
    v-model:sort-order="sortOrder"
    class="flex-1 min-h-[400px]"
    :columns="PHASE3_TABLE_COLUMNS"
    :circuits="sortedCircuits"
    :full-circuits="fullCircuits"
    :is-circuit-locked="isLocked"
    :is-complete="isComplete"
  >
    <template #cell-denatsuRs="{ row: circuit }">
      <PortalCellPhaseMeas
        v-model="getRowForm(circuit).rs"
        :label="getPhaseLabels(circuit).phase1"
        unit="V"
        :disabled="isRowDisabled(circuit)"
        :voltage-range="getVoltageRanges(circuit).phase1"
        @enter="handleConfirm(circuit)"
      />
    </template>

    <template #cell-denatsuSt="{ row: circuit }">
      <PortalCellPhaseMeas
        v-model="getRowForm(circuit).st"
        :label="getPhaseLabels(circuit).phase2"
        unit="V"
        :disabled="isRowDisabled(circuit)"
        :voltage-range="getVoltageRanges(circuit).phase2"
        @enter="handleConfirm(circuit)"
      />
    </template>

    <template #cell-denatsuRt="{ row: circuit }">
      <PortalCellPhaseMeas
        v-model="getRowForm(circuit).rt"
        :label="getPhaseLabels(circuit).phase3"
        unit="V"
        :disabled="isRowDisabled(circuit)"
        :voltage-range="getVoltageRanges(circuit).phase3"
        @enter="handleConfirm(circuit)"
      />
    </template>

    <template #cell-kensou="{ row: circuit }">
      <Select
        v-model="getRowForm(circuit).kensou"
        :options="getKensouOptions(circuit)"
        :clearable="false"
        :disabled="isRowDisabled(circuit)"
        class="w-20 min-w-[70px]"
      />
    </template>

    <template #cell-p3Remarks="{ row: circuit }">
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
        :locked-reason="isCircuitLocked(circuit) ? '幹線未完了' : 'P2未了'"
        :is-completed="isConfirmed(circuit)"
        :is-loading="Boolean(isActionLoading[circuit.id])"
        :disabled="hasVoltageOutOfRangeError(circuit)"
        @confirm="handleConfirm(circuit)"
        @clear="handleClearLocally(circuit)"
      />
    </template>
  </PortalTableSoudenCircuit>
</template>

<style scoped lang="scss">
.textarea-remarks {
  font-size: var(--font-size-xs);
}
</style>
