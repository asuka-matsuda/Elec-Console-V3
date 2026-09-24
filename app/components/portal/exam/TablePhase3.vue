<script setup lang="ts">
/**
 * TablePhase3
 * [Portal Organisms] フェーズ3（送電・電圧測定・検相）の回路一覧テーブルコンポーネント。
 * 回路情報の表示、手入力モード（最初からInput表示・Enter確定）、および解除/変更操作を管理します。
 */
import { reactive, ref, toRef, watch } from 'vue'

import { useTableSort } from '~/composables/useTableSort'
import {
  KENSOU_OPTIONS_1P,
  KENSOU_OPTIONS_3P,
  PHASE3_TABLE_COLUMNS,
} from '~/constants/soudenConstants'
import type { SelectOption } from '~/types/components'
import type { CircuitItem } from '~/types/souden'
import {
  getCircuitPhaseLabels,
  parseNullableNumber,
} from '~/utils/souden'

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
      kensou?: string
      remarks?: string
    },
  ]
  clear: [circuit: CircuitItem]
}>()

// 各行の手入力・編集状態
const editingRowId = ref<string | null>(null)

interface Phase3RowForm {
  rs: string | number
  st: string | number
  rt: string | number
  kensou: string
  remarks: string
}

const rowForms = reactive<Record<string, Phase3RowForm>>({})

const initRowForm = (circuit: CircuitItem): Phase3RowForm => {
  const isThree = props.isThreePhase(circuit)

  return {
    rs: circuit.denatsuRs != null ? circuit.denatsuRs : '',
    st: circuit.denatsuSt != null ? circuit.denatsuSt : '',
    rt: circuit.denatsuRt != null ? circuit.denatsuRt : '',
    kensou: circuit.kensou || (isThree ? '正相' : '点灯確認(良)'),
    remarks: circuit.p3Remarks ?? '',
  }
}

const getRowForm = (circuit: CircuitItem): Phase3RowForm => {
  const existing = rowForms[circuit.id]

  if (existing) return existing

  const newForm = initRowForm(circuit)

  rowForms[circuit.id] = newForm

  return newForm
}

// 回路データの変更時に未編集行のフォーム値を同期
watch(
  () => props.circuits,
  (newCircuits) => {
    for (const c of newCircuits) {
      if (editingRowId.value !== c.id) {
        rowForms[c.id] = initRowForm(c)
      }
    }
  },
  { immediate: true },
)

const isComplete = (circuit: CircuitItem) => Boolean(circuit.p3ConfirmedAt)
const isP2Complete = (circuit: CircuitItem) => Boolean(circuit.p2ConfirmedAt && circuit.p2IsComplete)
const isLocked = (circuit: CircuitItem) => props.isCircuitLocked(circuit) || !isP2Complete(circuit)

// 最初からInput表示: 未完了かつ非ロック・非除外、または明示的に編集中（変更クリック）の行
const isRowEditing = (circuit: CircuitItem) => {
  if (isLocked(circuit) || circuit.isExcluded) return false
  if (editingRowId.value === circuit.id) return true

  return !isComplete(circuit)
}

// 相ラベルの取得（三相: R-S / S-T / R-T, 単相: R-N / T-N / R-T）
const getPhaseLabels = (circuit: CircuitItem) => getCircuitPhaseLabels(props.isThreePhase(circuit))

// 検相セレクトの選択肢
const getKensouOptions = (circuit: CircuitItem): SelectOption[] => {
  return props.isThreePhase(circuit) ? KENSOU_OPTIONS_3P : KENSOU_OPTIONS_1P
}

// 完了済み行の編集開始
const startEdit = (circuit: CircuitItem) => {
  editingRowId.value = circuit.id
  rowForms[circuit.id] = initRowForm(circuit)
}

// 編集取消
const cancelEdit = (circuit: CircuitItem) => {
  editingRowId.value = null
  rowForms[circuit.id] = initRowForm(circuit)
}

const parseVal = parseNullableNumber

// 入力内容の確定
const saveInput = (circuit: CircuitItem) => {
  const form = getRowForm(circuit)

  emit('confirm', circuit, {
    rs: parseVal(form.rs),
    st: parseVal(form.st),
    rt: parseVal(form.rt),
    kensou: form.kensou,
    remarks: form.remarks,
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
    :columns="PHASE3_TABLE_COLUMNS"
    :circuits="sortedCircuits"
    :full-circuits="fullCircuits || circuits"
    :sort-by="sortBy"
    :sort-order="sortOrder"
    :is-circuit-locked="isLocked"
    :is-complete="isComplete"
    :editing-row-id="editingRowId"
    @sort="handleSort"
  >

    <template #cell-denatsuRs="{ row: circuit }">
      <PortalCellPhaseMeas
        v-model="getRowForm(circuit).rs"
        :label="getPhaseLabels(circuit).phase1"
        :val="circuit.denatsuRs"
        unit="V"
        :is-editing="isRowEditing(circuit)"
        @enter="saveInput(circuit)"
      />
    </template>

    <template #cell-denatsuSt="{ row: circuit }">
      <PortalCellPhaseMeas
        v-model="getRowForm(circuit).st"
        :label="getPhaseLabels(circuit).phase2"
        :val="circuit.denatsuSt"
        unit="V"
        :is-editing="isRowEditing(circuit)"
        @enter="saveInput(circuit)"
      />
    </template>

    <template #cell-denatsuRt="{ row: circuit }">
      <PortalCellPhaseMeas
        v-model="getRowForm(circuit).rt"
        :label="getPhaseLabels(circuit).phase3"
        :val="circuit.denatsuRt"
        unit="V"
        :is-editing="isRowEditing(circuit)"
        @enter="saveInput(circuit)"
      />
    </template>

    <template #cell-kensou="{ row: circuit }">
      <Select
        v-if="isRowEditing(circuit)"
        v-model="getRowForm(circuit).kensou"
        :options="getKensouOptions(circuit)"
        :clearable="false"
        class="min-w-24"
      />
      <Badge
        v-else-if="circuit.kensou"
        :id="circuit.kensou === '正相' || circuit.kensou === '点灯確認(良)' ? 'exam:pass' : 'exam:fail'"
      >
        {{ circuit.kensou }}
      </Badge>
      <span v-else class="cell-dash">-</span>
    </template>

    <template #cell-p3Remarks="{ row: circuit }">
      <Textarea
        v-if="isRowEditing(circuit)"
        v-model="getRowForm(circuit).remarks"
        :rows="2"
        placeholder="備考"
        class="w-full min-w-[100px] max-w-[180px] textarea-remarks"
      />
      <span v-else class="cell-remarks" :title="circuit.p3Remarks || ''">
        {{ circuit.p3Remarks || '-' }}
      </span>
    </template>

    <template #cell-actions="{ row: circuit }">
      <PortalCellSoudenActions
        :circuit="circuit"
        :is-locked="isLocked(circuit)"
        :locked-reason="isCircuitLocked(circuit) ? '幹線未完了' : 'P2未了'"
        :is-editing="editingRowId === circuit.id"
        :is-completed="isComplete(circuit)"
        :is-loading="isActionLoading[circuit.id]"
        confirm-label="確定"
        save-label="保存"
        :has-edit-button="false"
        @confirm="saveInput(circuit)"
        @clear="$emit('clear', circuit)"
        @edit="startEdit(circuit)"
        @save="saveInput(circuit)"
        @cancel="cancelEdit(circuit)"
      />
    </template>
  </PortalTableSoudenCircuit>
</template>

<style scoped lang="scss">
.cell-dash {
  color: var(--color-text-muted);
}

.textarea-remarks {
  resize: vertical;
  font-size: var(--font-size-xs);
}

.cell-remarks {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;

  max-width: 160px;

  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  text-overflow: ellipsis;
  word-break: break-all;
}
</style>
