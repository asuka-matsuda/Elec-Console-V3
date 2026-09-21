<script setup lang="ts">
/**
 * PortalPhase3Table
 * [Portal Organisms] フェーズ3（送電・電圧測定・検相）の回路一覧テーブルコンポーネント。
 * 回路情報の表示、手入力モード（各相電圧・検相・備考の入力）、標準値確定、および解除操作を管理します。
 */
import { reactive, ref, toRef } from 'vue'

import { useTableSort } from '~/composables/useTableSort'
import {
  KENSOU_OPTIONS_1P,
  KENSOU_OPTIONS_3P,
  PHASE3_TABLE_COLUMNS,
} from '~/constants/soudenConstants'
import type { SelectOption } from '~/types/components'
import type { CircuitItem } from '~/types/souden'

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
const inputForm = reactive({
  rs: '' as string | number,
  st: '' as string | number,
  rt: '' as string | number,
  kensou: '正相',
  remarks: '',
})

const isComplete = (circuit: CircuitItem) => Boolean(circuit.p3ConfirmedAt)
const isP2Complete = (circuit: CircuitItem) => Boolean(circuit.p2ConfirmedAt && circuit.p2IsComplete)

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

// 標準値の取得
const getStandardValues = (circuit: CircuitItem) => {
  if (props.isThreePhase(circuit)) {
    return {
      rs: 200,
      st: 200,
      rt: 200,
      kensou: '正相',
    }
  }

  return {
    rs: 100,
    st: 100,
    rt: 200,
    kensou: '点灯確認(良)',
  }
}

// 検相セレクトの選択肢
const getKensouOptions = (circuit: CircuitItem): SelectOption[] => {
  return props.isThreePhase(circuit) ? KENSOU_OPTIONS_3P : KENSOU_OPTIONS_1P
}

// クイック標準値確定
const handleQuickStandard = (circuit: CircuitItem) => {
  emit('confirm', circuit, getStandardValues(circuit))
}

// 手入力モードの開始
const startInput = (circuit: CircuitItem) => {
  const std = getStandardValues(circuit)

  editingRowId.value = circuit.id
  inputForm.rs = circuit.denatsuRs ?? std.rs
  inputForm.st = circuit.denatsuSt ?? std.st
  inputForm.rt = circuit.denatsuRt ?? std.rt
  inputForm.kensou = circuit.kensou || std.kensou
  inputForm.remarks = circuit.p3Remarks ?? ''
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
  emit('confirm', circuit, {
    rs: parseVal(inputForm.rs),
    st: parseVal(inputForm.st),
    rt: parseVal(inputForm.rt),
    kensou: inputForm.kensou,
    remarks: inputForm.remarks,
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
    :columns="PHASE3_TABLE_COLUMNS"
    :circuits="sortedCircuits"
    :full-circuits="fullCircuits || circuits"
    :sort-by="sortBy"
    :sort-order="sortOrder"
    :is-circuit-locked="(circuit) => isCircuitLocked(circuit) || !isP2Complete(circuit)"
    :is-complete="isComplete"
    :editing-row-id="editingRowId"
    @sort="handleSort"
  >
    <!-- 電圧 1 (RS / RN) -->
    <template #cell-denatsuRs="{ row: circuit }">
      <PortalPhase3VoltCell
        v-model="inputForm.rs"
        :label="getPhaseLabels(circuit).phase1"
        :val="circuit.denatsuRs"
        :is-editing="editingRowId === circuit.id"
        @enter="saveInput(circuit)"
      />
    </template>

    <!-- 電圧 2 (ST / TN) -->
    <template #cell-denatsuSt="{ row: circuit }">
      <PortalPhase3VoltCell
        v-model="inputForm.st"
        :label="getPhaseLabels(circuit).phase2"
        :val="circuit.denatsuSt"
        :is-editing="editingRowId === circuit.id"
        @enter="saveInput(circuit)"
      />
    </template>

    <!-- 電圧 3 (RT / RT) -->
    <template #cell-denatsuRt="{ row: circuit }">
      <PortalPhase3VoltCell
        v-model="inputForm.rt"
        :label="getPhaseLabels(circuit).phase3"
        :val="circuit.denatsuRt"
        :is-editing="editingRowId === circuit.id"
        @enter="saveInput(circuit)"
      />
    </template>

    <!-- 検相 / 点灯確認 -->
    <template #cell-kensou="{ row: circuit }">
      <Select
        v-if="editingRowId === circuit.id"
        v-model="inputForm.kensou"
        :options="getKensouOptions(circuit)"
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

    <!-- 備考 -->
    <template #cell-p3Remarks="{ row: circuit }">
      <Textarea
        v-if="editingRowId === circuit.id"
        v-model="inputForm.remarks"
        :rows="2"
        placeholder="備考"
      />
      <span v-else class="cell-remarks" :title="circuit.p3Remarks || ''">
        {{ circuit.p3Remarks || '-' }}
      </span>
    </template>

    <!-- 操作 -->
    <template #cell-actions="{ row: circuit }">
      <div class="flex items-center justify-center gap-1">
        <!-- 幹線未完了による操作不可 -->
        <template v-if="isCircuitLocked(circuit)">
          <span class="text-note inline-flex items-center gap-1">⏸ 幹線未完了</span>
        </template>

        <!-- 前フェーズ（P2）未完了による操作不可 -->
        <template v-else-if="!isP2Complete(circuit)">
          <span class="text-note inline-flex items-center gap-1">⏸ P2未了</span>
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
          <Button @click="cancelInput">
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
          <Button @click="startInput(circuit)">
            変更
          </Button>
        </template>

        <!-- 通常モード：未確定 -->
        <template v-else>
          <Button
            variant="success"
            :disabled="circuit.isExcluded"
            :loading="isActionLoading[circuit.id]"
            @click="handleQuickStandard(circuit)"
          >
            標準値確定
          </Button>
          <Button
            :disabled="circuit.isExcluded"
            @click="startInput(circuit)"
          >
            手入力
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

.cell-dash {
  color: var(--color-text-muted);
}

.text-note {
  font-size: inherit;
  font-weight: var(--font-weight-normal);
  color: var(--color-status-warning);
}
</style>
