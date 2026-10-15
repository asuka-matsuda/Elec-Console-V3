<script setup lang="ts">
/**
 * フェーズ3（送電・電圧測定・検相試験）画面
 * フェーズ3：送電・電圧測定・検相
 */
import { computed, onMounted } from 'vue'

import type { CircuitItem } from '#shared/types/circuit'
import { isPhase2Complete } from '#shared/utils/soudenExam'
import { usePhase3Exam } from '~/composables/portal/phase/usePhaseExam'
import { usePhasePageSync } from '~/composables/portal/phase/usePhasePageSync'
import { usePhaseTableForm } from '~/composables/portal/phase/usePhaseTableForm'
import { useTableSort } from '~/composables/useTableSort'
import {
  KENSOU_OPTIONS_1P,
  KENSOU_OPTIONS_3P,
  PHASE3_TABLE_COLUMNS,
} from '~/constants/soudenConstants'
import type { SelectOption } from '~/types/components'
import { formatShortDateTime } from '~/utils/date'
import {
  getCircuitPhaseLabels,
  getPhase3VoltageRanges,
  getSoudenRowClass,
  isPhase3KensouPass,
  isVoltageOutOfRange,
  parseNullableNumber,
} from '~/utils/souden'

useHead({ title: 'フェーズ3：送電・電圧測定・検相 - Elec-Console' })

const route = useRoute()
const siteId = computed(() => route.params.siteId as string)
const initialKeiTo = computed(() => (route.query.kei_to as string) || '幹線')

const {
  circuits,
  filteredCircuits,
  shubetsuTabOptions,
  availableFloorList,
  availableBanMeishoList,
  selectedKeiTo,
  selectedBanShubetsu,
  selectedFloor,
  selectedBanMeisho,
  phaseStats,
  isLoading,
  isActionLoading,
  isThreePhase,
  fetchCircuits,
  saveExcludedRemarks,
  confirmPhase3,
} = usePhase3Exam(siteId, initialKeiTo.value)

const { handleSelectCircuit } = usePhasePageSync({
  siteId,
  selectedKeiTo,
  selectedBanMeisho,
  filteredCircuits,
  fetchCircuits,
})

interface Phase3RowForm {
  rs: string | number
  st: string | number
  rt: string | number
  kensou: string
  remarks: string
}

const isP2Complete = (circuit: CircuitItem) => isPhase2Complete(circuit)
const isLocked = (circuit: CircuitItem) => !isP2Complete(circuit)

const initRowForm = (circuit: CircuitItem): Phase3RowForm => {
  const isThree = isThreePhase(circuit)

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
  circuits: () => filteredCircuits.value,
  initForm: initRowForm,
  isConfirmedServer: c => Boolean(c.p3ConfirmedAt),
  isCircuitLocked: isLocked,
  isActionLoading: () => isActionLoading.value,
})

const {
  sortBy,
  sortOrder,
  sortedData: sortedCircuits,
} = useTableSort(filteredCircuits)

const getPhaseLabels = (circuit: CircuitItem) => getCircuitPhaseLabels(isThreePhase(circuit))

const getVoltageRanges = (circuit: CircuitItem) => {
  return getPhase3VoltageRanges(circuit.haidenHoushiki, isThreePhase(circuit))
}

const getKensouOptions = (circuit: CircuitItem): SelectOption[] => {
  return isThreePhase(circuit) ? KENSOU_OPTIONS_3P : KENSOU_OPTIONS_1P
}

const isComplete = (c: CircuitItem) => {
  return Boolean(isConfirmed(c) && c.p3IsComplete)
}

const hasVoltageOutOfRangeError = (circuit: CircuitItem): boolean => {
  const form = getRowForm(circuit)
  const rsNum = parseNullableNumber(form.rs)
  const stNum = parseNullableNumber(form.st)
  const rtNum = parseNullableNumber(form.rt)
  const ranges = getVoltageRanges(circuit)

  return (rsNum !== null && isVoltageOutOfRange(rsNum, ranges.phase1))
    || (stNum !== null && isVoltageOutOfRange(stNum, ranges.phase2))
    || (rtNum !== null && isVoltageOutOfRange(rtNum, ranges.phase3))
}

const handleConfirmCircuit = (circuit: CircuitItem) => {
  if (isRowDisabled(circuit) || hasVoltageOutOfRangeError(circuit)) return

  const form = getRowForm(circuit)
  const rsNum = parseNullableNumber(form.rs)
  const stNum = parseNullableNumber(form.st)
  const rtNum = parseNullableNumber(form.rt)
  const isThree = isThreePhase(circuit)

  const isKensouOk = isPhase3KensouPass(form.kensou, isThree)

  const ranges = getVoltageRanges(circuit)
  const isVoltageOk = rsNum !== null && !isVoltageOutOfRange(rsNum, ranges.phase1)
    && stNum !== null && !isVoltageOutOfRange(stNum, ranges.phase2)
    && rtNum !== null && !isVoltageOutOfRange(rtNum, ranges.phase3)

  const isAllComplete = isKensouOk && isVoltageOk

  markConfirmedLocally(circuit)

  confirmPhase3(circuit, {
    rs: rsNum,
    st: stNum,
    rt: rtNum,
    kensou: form.kensou,
    remarks: form.remarks,
    isComplete: isAllComplete,
  })
}

const handleSaveExcludedRemarks = (circuit: CircuitItem) => {
  const form = getRowForm(circuit)

  saveExcludedRemarks(circuit, form.remarks)
}

const getNextPhase1Path = (circuit: CircuitItem): string => {
  const list = circuits.value && circuits.value.length > 0
    ? circuits.value
    : sortedCircuits.value

  const currentIndex = list.findIndex(c => c.id === circuit.id)

  let nextCircuit: CircuitItem | undefined

  if (currentIndex !== -1) {
    nextCircuit = list.slice(currentIndex + 1).find(c => !c.p1ConfirmedAt || !c.p3IsComplete)

    if (!nextCircuit && currentIndex + 1 < list.length) {
      nextCircuit = list[currentIndex + 1]
    }

    if (!nextCircuit) {
      nextCircuit = list.find(c => !c.p1ConfirmedAt || !c.p3IsComplete)
    }
  }

  const targetId = nextCircuit ? nextCircuit.id : circuit.id

  return `/portal/${circuit.siteId}/phase1?kei_to=${encodeURIComponent(circuit.keiTo || '幹線')}&targetCircuit=${encodeURIComponent(targetId)}`
}

onMounted(() => {
  fetchCircuits()
})
</script>

<template>
  <div class="flex flex-1 flex-col gap-section-gap min-h-0">

    <section class="panel grid grid-cols-1 lg:grid-cols-2 gap-panel-gap items-start">
      <div class="flex flex-col gap-form-row-gap">
        <div class="flex items-center gap-form-col-gap">
          <span class="shrink-0 label">盤種別:</span>
          <Switch v-model="selectedBanShubetsu" :options="shubetsuTabOptions" size="sm" class="shrink-0" />
        </div>

        <div class="flex flex-wrap items-center gap-form-col-gap">
          <div class="flex items-center gap-item-gap">
            <label for="filter-area-p3" class="shrink-0 label">エリア:</label>
            <Select id="filter-area-p3" v-model="selectedFloor" :options="availableFloorList" class="w-40" />
          </div>

          <div class="flex items-center gap-item-gap">
            <label for="filter-ban-p3" class="shrink-0 label">盤名称:</label>
            <Select id="filter-ban-p3" v-model="selectedBanMeisho" :options="availableBanMeishoList" class="w-40" />
          </div>

          <span class="whitespace-nowrap field-help-text">
            対象回路: <strong>{{ phaseStats.allCount }}</strong> 件
          </span>
        </div>
      </div>

      <div class="flex flex-col gap-form-row-gap">
        <div class="flex flex-col gap-inline-gap">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-item-gap">
              <span>フェーズ3 進捗状況</span>
              <PortalSyncStatusBadge :site-id="siteId" />
            </div>
            <div class="flex items-center gap-item-gap justify-end min-w-[160px] text-right tabular-nums">
              <span><strong>{{ phaseStats.completed }}</strong> / {{ phaseStats.total }}</span>
              <span>({{ phaseStats.pct }}%)</span>
              <small v-if="phaseStats.excluded > 0">(除外: {{ phaseStats.excluded }})</small>
            </div>
          </div>
          <Progress :value="phaseStats.pct" />
        </div>

        <PortalExamMinimap :circuits="filteredCircuits" :phase="3" :loading="isLoading" @select-circuit="handleSelectCircuit" />
      </div>
    </section>

    <Table v-model:sort-by="sortBy" v-model:sort-order="sortOrder" :columns="PHASE3_TABLE_COLUMNS" :data="sortedCircuits" :loading="isLoading" :skeleton-rows="8" :row-id="(row) => `row-${row.id}`" :row-class="(row) => getSoudenRowClass(row, { isComplete, isCircuitLocked: isLocked, editingRowId: null })" class="flex-1 min-h-[400px]">
      <template #cell-banMeisho="{ row: circuit }">
        <div class="flex flex-col gap-micro-gap min-w-0">
          <strong>{{ circuit.banMeisho || '-' }}</strong>
          <small v-if="circuit.banShubetsu">{{ circuit.banShubetsu }}</small>
        </div>
      </template>

      <template #cell-kairoBangou="{ row: circuit }">
        <div class="flex items-center justify-center">
          <PortalCircuitSymbol :kigou="circuit.kairoKigou" :bangou="circuit.kairoBangou" />
        </div>
      </template>

      <template #cell-kairoMeisho="{ row: circuit }">
        <span class="whitespace-pre block" :title="circuit.kairoMeisho || ''">{{ circuit.kairoMeisho || '-' }}</span>
      </template>

      <template #cell-p3ConfirmedAt="{ row: circuit }">
        <div v-if="circuit.p3Worker" class="flex flex-col items-center gap-micro-gap">
          <strong>{{ circuit.p3Worker }}</strong>
          <time>{{ formatShortDateTime(circuit.p3ConfirmedAt) }}</time>
        </div>
        <small v-else>-</small>
      </template>

      <template #cell-denatsuRs="{ row: circuit }">
        <div class="flex flex-col items-center gap-inline-gap">
          <small>{{ getPhaseLabels(circuit).phase1 }}</small>
          <Input v-model="getRowForm(circuit).rs" type="number" step="any" inputmode="decimal" :placeholder="String(getVoltageRanges(circuit).phase1.target)" :error="!isRowDisabled(circuit) && isVoltageOutOfRange(getRowForm(circuit).rs, getVoltageRanges(circuit).phase1)" :disabled="isRowDisabled(circuit)" class="w-[85px]" @keydown.enter.prevent="handleConfirmCircuit(circuit)" />
          <p v-if="!isRowDisabled(circuit) && isVoltageOutOfRange(getRowForm(circuit).rs, getVoltageRanges(circuit).phase1)" class="error-text whitespace-nowrap">±10%範囲外です</p>
        </div>
      </template>

      <template #cell-denatsuSt="{ row: circuit }">
        <div class="flex flex-col items-center gap-inline-gap">
          <small>{{ getPhaseLabels(circuit).phase2 }}</small>
          <Input v-model="getRowForm(circuit).st" type="number" step="any" inputmode="decimal" :placeholder="String(getVoltageRanges(circuit).phase2.target)" :error="!isRowDisabled(circuit) && isVoltageOutOfRange(getRowForm(circuit).st, getVoltageRanges(circuit).phase2)" :disabled="isRowDisabled(circuit)" class="w-[85px]" @keydown.enter.prevent="handleConfirmCircuit(circuit)" />
          <p v-if="!isRowDisabled(circuit) && isVoltageOutOfRange(getRowForm(circuit).st, getVoltageRanges(circuit).phase2)" class="error-text whitespace-nowrap">±10%範囲外です</p>
        </div>
      </template>

      <template #cell-denatsuRt="{ row: circuit }">
        <div class="flex flex-col items-center gap-inline-gap">
          <small>{{ getPhaseLabels(circuit).phase3 }}</small>
          <Input v-model="getRowForm(circuit).rt" type="number" step="any" inputmode="decimal" :placeholder="String(getVoltageRanges(circuit).phase3.target)" :error="!isRowDisabled(circuit) && isVoltageOutOfRange(getRowForm(circuit).rt, getVoltageRanges(circuit).phase3)" :disabled="isRowDisabled(circuit)" class="w-[85px]" @keydown.enter.prevent="handleConfirmCircuit(circuit)" />
          <p v-if="!isRowDisabled(circuit) && isVoltageOutOfRange(getRowForm(circuit).rt, getVoltageRanges(circuit).phase3)" class="error-text whitespace-nowrap">±10%範囲外です</p>
        </div>
      </template>

      <template #cell-kensou="{ row: circuit }">
        <Select v-model="getRowForm(circuit).kensou" :options="getKensouOptions(circuit)" :disabled="isRowDisabled(circuit)" class="w-20 min-w-[70px]" />
      </template>

      <template #cell-p3Remarks="{ row: circuit }">
        <Textarea v-model="getRowForm(circuit).remarks" size="sm" :rows="1" auto-resize trim placeholder="備考" class="w-full" :disabled="(!circuit.isExcluded && isConfirmed(circuit)) || Boolean(isActionLoading[circuit.id])" />
      </template>

      <template #cell-actions="{ row: circuit }">
        <div class="flex items-center justify-center gap-inline-gap whitespace-nowrap">
          <template v-if="circuit.isExcluded">
            <Badge variant="gray">除外</Badge>
            <Button variant="secondary" size="sm" :loading="Boolean(isActionLoading[circuit.id])" @click="handleSaveExcludedRemarks(circuit)">備考保存</Button>
          </template>
          <span v-else-if="isLocked(circuit)" class="inline-flex items-center gap-inline-gap">⏸ P2未了</span>
          <template v-else-if="isConfirmed(circuit)">
            <Button variant="secondary" size="sm" suffix-icon="arrow-right" :to="getNextPhase1Path(circuit)">フェーズ1へ進む</Button>
            <Button variant="danger" size="sm" :disabled="Boolean(isActionLoading[circuit.id])" @click="handleClearLocally(circuit)">解除する</Button>
          </template>
          <Button v-else variant="primary" size="sm" :disabled="hasVoltageOutOfRangeError(circuit)" :loading="Boolean(isActionLoading[circuit.id])" @click="handleConfirmCircuit(circuit)">確定する</Button>
        </div>
      </template>
    </Table>
  </div>
</template>
