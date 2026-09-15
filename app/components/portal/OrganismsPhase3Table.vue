<script setup lang="ts">
/**
 * PortalOrganismsPhase3Table
 * フェーズ3（送電・電圧測定・検相）の回路一覧テーブルOrganismコンポーネント。
 * 回路情報の表示、手入力モード（各相電圧・検相・備考の入力）、標準値確定、および解除の各操作を管理します。
 */
import { computed, reactive, ref } from 'vue'

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

// 各行の編集・手入力状態
const editingRowId = ref<string | null>(null)
const inputForm = reactive({
  rs: '' as string | number,
  st: '' as string | number,
  rt: '' as string | number,
  kensou: '正相',
  remarks: '',
})

const isComplete = (c: CircuitItem) => Boolean(c.p3ConfirmedAt)
const isP2Complete = (c: CircuitItem) => Boolean(c.p2ConfirmedAt && c.p2IsComplete)

// 相ラベルの取得
const getPhaseLabels = (circuit: CircuitItem) => {
  if (props.isThreePhase(circuit)) {
    return {
      label1: 'R - S',
      label2: 'S - T',
      label3: 'R - T',
      defaultRs: 200,
      defaultSt: 200,
      defaultRt: 200,
      defaultKensou: '正相',
    }
  }

  return {
    label1: 'R - N',
    label2: 'T - N',
    label3: 'R - T',
    defaultRs: 100,
    defaultSt: 100,
    defaultRt: 200,
    defaultKensou: '点灯確認(良)',
  }
}

// 検相セレクトの選択肢
const getKensouOptions = (circuit: CircuitItem): SelectOption[] => {
  return props.isThreePhase(circuit) ? KENSOU_OPTIONS_3P : KENSOU_OPTIONS_1P
}

// 標準値確定
const handleQuickStandard = (circuit: CircuitItem) => {
  const labels = getPhaseLabels(circuit)

  emit('confirm', circuit, {
    rs: labels.defaultRs,
    st: labels.defaultSt,
    rt: labels.defaultRt,
    kensou: labels.defaultKensou,
  })
}

// 手入力モードの開始
const startInput = (circuit: CircuitItem) => {
  const labels = getPhaseLabels(circuit)

  editingRowId.value = circuit.id
  inputForm.rs = circuit.denatsuRs ?? labels.defaultRs
  inputForm.st = circuit.denatsuSt ?? labels.defaultSt
  inputForm.rt = circuit.denatsuRt ?? labels.defaultRt
  inputForm.kensou = circuit.kensou || labels.defaultKensou
  inputForm.remarks = circuit.p3Remarks ?? ''
}

const cancelInput = () => {
  editingRowId.value = null
}

const handleInputFocus = (event: FocusEvent) => {
  const target = event.target as HTMLInputElement | null

  if (target) {
    target.select()
  }
}

// 手入力内容の確定
const saveInput = (circuit: CircuitItem) => {
  const rsNum = typeof inputForm.rs === 'string' && inputForm.rs !== '' ? parseFloat(inputForm.rs) : typeof inputForm.rs === 'number' ? inputForm.rs : null
  const stNum = typeof inputForm.st === 'string' && inputForm.st !== '' ? parseFloat(inputForm.st) : typeof inputForm.st === 'number' ? inputForm.st : null
  const rtNum = typeof inputForm.rt === 'string' && inputForm.rt !== '' ? parseFloat(inputForm.rt) : typeof inputForm.rt === 'number' ? inputForm.rt : null

  emit('confirm', circuit, {
    rs: rsNum,
    st: stNum,
    rt: rtNum,
    kensou: inputForm.kensou,
    remarks: inputForm.remarks,
  })

  editingRowId.value = null
}

// ソート管理
const circuitsRef = computed(() => props.circuits)
const {
  sortBy,
  sortOrder,
  sortedData: sortedCircuits,
  handleSort,
} = useTableSort(circuitsRef)
</script>

<template>
  <PortalOrganismsSoudenCircuitTable
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
    <!-- 回路番号 -->
    <template #cell-kairoBangou="{ row: circuit }">
      <div class="flex flex-col items-center justify-center gap-1">
        <AtomsBadge :color="isThreePhase(circuit) ? 'var(--color-status-warning)' : 'var(--color-text-muted)'">
          {{ isThreePhase(circuit) ? '動力' : '電灯' }}
        </AtomsBadge>
        <PortalAtomsKairoSymbol
          :kigou="circuit.kairoKigou"
          :bangou="circuit.kairoBangou"
        />
      </div>
    </template>

    <!-- 回路名称 -->
    <template #cell-kairoMeisho="{ row: circuit }">
      <span class="cell-meisho" :title="circuit.kairoMeisho || ''">
        {{ circuit.kairoMeisho || '-' }}
      </span>
    </template>

    <!-- 電圧 1 (RS / RN) -->
    <template #cell-denatsuRs="{ row: circuit }">
      <PortalMoleculesPhase3VoltCell
        v-model="inputForm.rs"
        :label="getPhaseLabels(circuit).label1"
        :val="circuit.denatsuRs"
        :is-editing="editingRowId === circuit.id"
        @focus="handleInputFocus"
        @enter="saveInput(circuit)"
      />
    </template>

    <!-- 電圧 2 (ST / TN) -->
    <template #cell-denatsuSt="{ row: circuit }">
      <PortalMoleculesPhase3VoltCell
        v-model="inputForm.st"
        :label="getPhaseLabels(circuit).label2"
        :val="circuit.denatsuSt"
        :is-editing="editingRowId === circuit.id"
        @focus="handleInputFocus"
        @enter="saveInput(circuit)"
      />
    </template>

    <!-- 電圧 3 (RT / RT) -->
    <template #cell-denatsuRt="{ row: circuit }">
      <PortalMoleculesPhase3VoltCell
        v-model="inputForm.rt"
        :label="getPhaseLabels(circuit).label3"
        :val="circuit.denatsuRt"
        :is-editing="editingRowId === circuit.id"
        @focus="handleInputFocus"
        @enter="saveInput(circuit)"
      />
    </template>

    <!-- 検相 / 点灯確認 -->
    <template #cell-kensou="{ row: circuit }">
      <template v-if="editingRowId === circuit.id">
        <AtomsSelect
          v-model="inputForm.kensou"
          :options="getKensouOptions(circuit)"
          class="min-w-24"
        />
      </template>
      <template v-else-if="circuit.kensou">
        <AtomsBadge
          :color="circuit.kensou === '正相' || circuit.kensou === '点灯確認(良)' ? 'var(--color-status-success)' : 'var(--color-status-danger)'"
        >
          {{ circuit.kensou }}
        </AtomsBadge>
      </template>
      <span v-else class="cell-dash">-</span>
    </template>

    <!-- 備考 -->
    <template #cell-p3Remarks="{ row: circuit }">
      <template v-if="editingRowId === circuit.id">
        <AtomsInput
          v-model="inputForm.remarks"
          type="textarea"
          :rows="2"
          placeholder="備考"
        />
      </template>
      <span v-else class="cell-remarks" :title="circuit.p3Remarks || ''">
        {{ circuit.p3Remarks || '-' }}
      </span>
    </template>

    <!-- 操作 -->
    <template #cell-actions="{ row: circuit }">
      <div class="flex items-center justify-center gap-1">
        <!-- 幹線未完了による操作不可 -->
        <template v-if="isCircuitLocked(circuit)">
          <span class="text-note inline-flex items-center gap-1">⏸ 幹線未了</span>
        </template>

        <!-- 前フェーズ（P2）未完了による操作不可 -->
        <template v-else-if="!isP2Complete(circuit)">
          <span class="text-note inline-flex items-center gap-1">⏸ P2未了</span>
        </template>

        <!-- 手入力編集モード中 -->
        <template v-else-if="editingRowId === circuit.id">
          <AtomsButton
            variant="success"
            :loading="isActionLoading[circuit.id]"
            @click="saveInput(circuit)"
          >
            確定
          </AtomsButton>
          <AtomsButton
            variant="secondary"
            @click="cancelInput"
          >
            取消
          </AtomsButton>
        </template>

        <!-- 通常モード：確定済み -->
        <template v-else-if="isComplete(circuit)">
          <AtomsButton
            variant="danger"
            :loading="isActionLoading[circuit.id]"
            @click="$emit('clear', circuit)"
          >
            解除
          </AtomsButton>
          <AtomsButton
            variant="secondary"
            @click="startInput(circuit)"
          >
            変更
          </AtomsButton>
        </template>

        <!-- 通常モード：未確定 -->
        <template v-else>
          <AtomsButton
            variant="primary"
            :disabled="circuit.isExcluded"
            :loading="isActionLoading[circuit.id]"
            @click="handleQuickStandard(circuit)"
          >
            標準値確定
          </AtomsButton>
          <AtomsButton
            variant="secondary"
            :disabled="circuit.isExcluded"
            @click="startInput(circuit)"
          >
            手入力
          </AtomsButton>
        </template>
      </div>
    </template>

    <!-- 測定者 / 日時 -->
    <template #cell-p3ConfirmedAt="{ row: circuit }">
      <PortalMoleculesSoudenWorkerCell
        :worker="circuit.p3Worker"
        :confirmed-at="circuit.p3ConfirmedAt"
      />
    </template>
  </PortalOrganismsSoudenCircuitTable>
</template>

<style scoped lang="scss">
.cell-meisho {
  display: block;

  max-width: 100%;

  font-size: inherit;
  font-weight: var(--font-weight-normal);
  line-height: 1.3;
  color: var(--color-text-main);
  white-space: pre-line;
}

.cell-remarks {
  overflow: hidden;
  display: block;

  max-width: 100%;

  font-size: inherit;
  color: var(--color-text-secondary);
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
