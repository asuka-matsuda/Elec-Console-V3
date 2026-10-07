<script setup lang="ts">
/**
 * フェーズ2（絶縁抵抗測定試験）画面
 * フェーズ2：絶縁抵抗測定（メガ測定）
 */
import { computed, nextTick, onMounted, watch } from 'vue'

import type { CircuitItem } from '#shared/types/circuit'
import { isPhase1Complete } from '#shared/utils/soudenExam'
import { usePhase2Exam } from '~/composables/portal/phase/usePhaseExam'
import { usePhaseTableForm } from '~/composables/portal/phase/usePhaseTableForm'
import { useOfflineSync } from '~/composables/portal/useOfflineSync'
import { useTableSort } from '~/composables/useTableSort'
import { PHASE2_TABLE_COLUMNS } from '~/constants/soudenConstants'
import { formatShortDateTime } from '~/utils/date'
import {
  getCircuitPhaseLabels,
  getPhase2Threshold,
  getSoudenRowClass,
  parseNullableNumber,
} from '~/utils/souden'
import { scrollToTableRow } from '~/utils/table'

useHead({ title: 'フェーズ2：絶縁抵抗測定 - Elec-Console' })

const route = useRoute()
const siteId = computed(() => route.params.siteId as string)
const initialKeiTo = computed(() => (route.query.kei_to as string) || '幹線')

const {
  filteredCircuits,
  shubetsuTabOptions,
  availableBanMeishoList,
  selectedKeiTo,
  selectedBanShubetsu,
  selectedBanMeisho,
  phaseStats,
  phase2ThresholdMegOhm,
  isActionLoading,
  isThreePhase,
  evalMegStatus,
  fetchCircuits,
  confirmPhase2,
} = usePhase2Exam(siteId, initialKeiTo.value)

const { lastSyncedAt } = useOfflineSync(siteId)

watch(lastSyncedAt, (newVal) => {
  if (newVal) {
    fetchCircuits()
  }
})

watch(
  () => route.query.kei_to,
  (newKeiTo) => {
    if (newKeiTo && typeof newKeiTo === 'string') {
      selectedKeiTo.value = newKeiTo
      fetchCircuits()
    }
  },
)

watch(
  () => route.query.ban,
  (newBan) => {
    if (newBan && typeof newBan === 'string') {
      selectedBanMeisho.value = newBan
    }
    else {
      selectedBanMeisho.value = 'ALL'
    }
  },
  { immediate: true },
)

// 遷移時にクエリで指定された回路への自動スクロール＆ハイライト
const targetCircuitId = computed(() => route.query.targetCircuit as string | undefined)

watch(
  [filteredCircuits, targetCircuitId],
  ([newCircuits, targetId]) => {
    if (targetId && newCircuits && newCircuits.some(c => c.id === targetId)) {
      nextTick(() => {
        setTimeout(() => {
          scrollToTableRow(targetId, 2500)
        }, 150)
      })
    }
  },
  { immediate: true },
)

const handleSelectCircuit = (circuit: CircuitItem) => {
  scrollToTableRow(circuit.id)
}

interface Phase2RowForm {
  rVal: string | number
  sVal: string | number
  tVal: string | number
  remarks: string
}

const isP1Complete = (circuit: CircuitItem) => isPhase1Complete(circuit)
const isLocked = (circuit: CircuitItem) => !isP1Complete(circuit)

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
  circuits: () => filteredCircuits.value,
  initForm: initRowForm,
  isConfirmedServer: c => Boolean(c.p2ConfirmedAt),
  isCircuitLocked: isLocked,
  isActionLoading: () => isActionLoading.value,
})

const {
  sortBy,
  sortOrder,
  sortedData: sortedCircuits,
} = useTableSort(filteredCircuits)

const getPhaseLabels = (circuit: CircuitItem) => getCircuitPhaseLabels(isThreePhase(circuit))

const handleFillAllOk = (circuit: CircuitItem) => {
  if (isRowDisabled(circuit)) return
  const form = getRowForm(circuit)

  form.rVal = 100
  form.sVal = 100
  form.tVal = 100
}

const evaluateStatus = (val: number | null, circuit: CircuitItem): 'OK' | 'NG' | null => {
  if (val === null) return null
  if (evalMegStatus) return evalMegStatus(val)

  const threshold = phase2ThresholdMegOhm.value ?? getPhase2Threshold(circuit.haidenHoushiki)

  return val >= threshold ? 'OK' : 'NG'
}

const isBelowThreshold = (val: string | number, haidenHoushiki?: string | null): boolean => {
  if (val === '' || val === null || val === undefined) return false

  const num = typeof val === 'number' ? val : parseFloat(String(val).trim())

  if (isNaN(num) || !isFinite(num)) return false

  const threshold = phase2ThresholdMegOhm.value ?? getPhase2Threshold(haidenHoushiki)

  return num < threshold
}

const isComplete = (c: CircuitItem) => {
  return Boolean(isConfirmed(c) && c.p2IsComplete)
}

const handleConfirmCircuit = (circuit: CircuitItem) => {
  const form = getRowForm(circuit)

  const rNum = parseNullableNumber(form.rVal)
  const sNum = parseNullableNumber(form.sVal)
  const tNum = parseNullableNumber(form.tVal)

  const rStatus = evaluateStatus(rNum, circuit)
  const sStatus = evaluateStatus(sNum, circuit)
  const tStatus = evaluateStatus(tNum, circuit)

  const isAllOk = rStatus === 'OK' && sStatus === 'OK' && tStatus === 'OK'

  markConfirmedLocally(circuit)

  confirmPhase2(circuit, {
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
            <label for="filter-ban-p2" class="shrink-0 label">盤名称:</label>
            <Select id="filter-ban-p2" v-model="selectedBanMeisho" :options="availableBanMeishoList" class="w-40" />
          </div>

          <span class="whitespace-nowrap count-label">
            対象回路: <strong>{{ phaseStats.allCount }}</strong> 件
          </span>
        </div>
      </div>

      <div class="flex flex-col gap-form-row-gap">
        <div class="flex flex-col gap-inline-gap">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-item-gap">
              <span>フェーズ2 進捗状況</span>
              <PortalSyncStatusBadge :site-id="siteId" />
            </div>
            <div class="flex items-center gap-item-gap">
              <span><strong>{{ phaseStats.completed }}</strong> / {{ phaseStats.total }}</span>
              <span>({{ phaseStats.pct }}%)</span>
              <small v-if="phaseStats.excluded > 0" class="text-muted">(除外: {{ phaseStats.excluded }})</small>
            </div>
          </div>
          <Progress :value="phaseStats.pct" />
        </div>

        <PortalExamMinimap :circuits="filteredCircuits" :phase="2" @select-circuit="handleSelectCircuit" />
      </div>
    </section>

    <Table v-model:sort-by="sortBy" v-model:sort-order="sortOrder" :columns="PHASE2_TABLE_COLUMNS" :data="sortedCircuits" :row-id="(row) => `row-${row.id}`" :row-class="(row) => getSoudenRowClass(row, { isComplete, isCircuitLocked: isLocked, editingRowId: null })" class="flex-1 min-h-[400px]">
      <template #cell-banMeisho="{ row: circuit }">
        <div class="flex flex-col gap-0.5 min-w-0">
          <span class="ban-name">{{ circuit.banMeisho || '-' }}</span>
          <span v-if="circuit.banShubetsu" class="ban-type">{{ circuit.banShubetsu }}</span>
        </div>
      </template>

      <template #cell-kairoBangou="{ row: circuit }">
        <div class="flex items-center justify-center">
          <PortalCircuitSymbol :kigou="circuit.kairoKigou" :bangou="circuit.kairoBangou" />
        </div>
      </template>

      <template #cell-kairoMeisho="{ row: circuit }">
        <span class="circuit-meisho block" :title="circuit.kairoMeisho || ''">{{ circuit.kairoMeisho || '-' }}</span>
      </template>

      <template #cell-p2ConfirmedAt="{ row: circuit }">
        <div v-if="circuit.p2Worker" class="flex flex-col items-center gap-0.5">
          <span class="cell-worker">{{ circuit.p2Worker }}</span>
          <span class="cell-date">{{ formatShortDateTime(circuit.p2ConfirmedAt) }}</span>
        </div>
        <span v-else class="cell-dash">-</span>
      </template>

      <template #cell-zetsuenR="{ row: circuit }">
        <div class="flex flex-col items-center gap-inline-gap">
          <span class="cell-label">{{ getPhaseLabels(circuit).phase1 }}</span>
          <Input v-model="getRowForm(circuit).rVal" type="number" step="0.01" inputmode="decimal" placeholder="100" :error="!isRowDisabled(circuit) && isBelowThreshold(getRowForm(circuit).rVal, circuit.haidenHoushiki)" :disabled="isRowDisabled(circuit)" class="w-[85px]" @keydown.enter.prevent="handleConfirmCircuit(circuit)" />
          <span v-if="!isRowDisabled(circuit) && isBelowThreshold(getRowForm(circuit).rVal, circuit.haidenHoushiki)" class="cell-warning-sub">基準値未満です</span>
          <Badge v-if="isConfirmed(circuit) && circuit.p2RStatus" :variant="circuit.p2RStatus === 'OK' ? 'green' : 'red'">{{ circuit.p2RStatus }}</Badge>
        </div>
      </template>

      <template #cell-zetsuenS="{ row: circuit }">
        <div class="flex flex-col items-center gap-inline-gap">
          <span class="cell-label">{{ getPhaseLabels(circuit).phase2 }}</span>
          <Input v-model="getRowForm(circuit).sVal" type="number" step="0.01" inputmode="decimal" placeholder="100" :error="!isRowDisabled(circuit) && isBelowThreshold(getRowForm(circuit).sVal, circuit.haidenHoushiki)" :disabled="isRowDisabled(circuit)" class="w-[85px]" @keydown.enter.prevent="handleConfirmCircuit(circuit)" />
          <span v-if="!isRowDisabled(circuit) && isBelowThreshold(getRowForm(circuit).sVal, circuit.haidenHoushiki)" class="cell-warning-sub">基準値未満です</span>
          <Badge v-if="isConfirmed(circuit) && circuit.p2SStatus" :variant="circuit.p2SStatus === 'OK' ? 'green' : 'red'">{{ circuit.p2SStatus }}</Badge>
        </div>
      </template>

      <template #cell-zetsuenT="{ row: circuit }">
        <div class="flex flex-col items-center gap-inline-gap">
          <span class="cell-label">{{ getPhaseLabels(circuit).phase3 }}</span>
          <Input v-model="getRowForm(circuit).tVal" type="number" step="0.01" inputmode="decimal" placeholder="100" :error="!isRowDisabled(circuit) && isBelowThreshold(getRowForm(circuit).tVal, circuit.haidenHoushiki)" :disabled="isRowDisabled(circuit)" class="w-[85px]" @keydown.enter.prevent="handleConfirmCircuit(circuit)" />
          <span v-if="!isRowDisabled(circuit) && isBelowThreshold(getRowForm(circuit).tVal, circuit.haidenHoushiki)" class="cell-warning-sub">基準値未満です</span>
          <Badge v-if="isConfirmed(circuit) && circuit.p2TStatus" :variant="circuit.p2TStatus === 'OK' ? 'green' : 'red'">{{ circuit.p2TStatus }}</Badge>
        </div>
      </template>

      <template #cell-p2Remarks="{ row: circuit }">
        <Textarea v-model="getRowForm(circuit).remarks" size="sm" :rows="1" auto-resize trim placeholder="備考" class="w-full textarea-remarks" :disabled="isRowDisabled(circuit)" />
      </template>

      <template #cell-actions="{ row: circuit }">
        <div class="cell-actions flex items-center justify-center gap-inline-gap whitespace-nowrap">
          <span v-if="isLocked(circuit)" class="text-note inline-flex items-center gap-inline-gap">⏸ P1未了</span>
          <template v-else-if="isConfirmed(circuit)">
            <Button variant="secondary" size="sm" suffix-icon="arrow-right" :to="`/portal/${circuit.siteId}/phase3?kei_to=${encodeURIComponent(circuit.keiTo || '幹線')}&targetCircuit=${encodeURIComponent(circuit.id)}`">フェーズ3へ進む</Button>
            <Button variant="danger" size="sm" :disabled="circuit.isExcluded || Boolean(isActionLoading[circuit.id])" @click="handleClearLocally(circuit)">解除する</Button>
          </template>
          <template v-else>
            <Button variant="secondary" size="sm" :disabled="circuit.isExcluded || Boolean(isActionLoading[circuit.id])" @click="handleFillAllOk(circuit)">全相をOKにする</Button>
            <Button variant="primary" size="sm" :disabled="circuit.isExcluded" :loading="Boolean(isActionLoading[circuit.id])" @click="handleConfirmCircuit(circuit)">確定する</Button>
          </template>
        </div>
      </template>
    </Table>
  </div>
</template>

<style scoped lang="scss">
.count-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.ban-name {
  overflow: hidden;
  font-weight: var(--font-weight-bold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ban-type {
  overflow: hidden;

  font-size: var(--font-size-2xs);
  color: var(--color-text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.circuit-meisho {
  font-size: inherit;
  font-weight: var(--font-weight-normal);
  line-height: 1.3;
  color: var(--color-text-main);
  white-space: pre-line;
}

.cell-worker {
  color: var(--color-status-success);
}

.cell-date,
.cell-dash {
  font-family: var(--font-mono);
  font-size: var(--font-size-2xs);
  color: var(--color-text-muted);
}

.textarea-remarks {
  font-size: var(--font-size-xs);
}

.cell-label {
  font-size: var(--font-size-2xs);
  color: var(--color-text-secondary);
}

.cell-warning-sub {
  font-size: var(--font-size-2xs);
  font-weight: var(--font-weight-medium);
  line-height: 1.1;
  color: var(--color-status-danger);
  white-space: nowrap;
}

.cell-actions {
  font-size: var(--font-size-xs);
}

.text-note {
  font-size: inherit;
  font-weight: var(--font-weight-normal);
  color: var(--color-status-warning);
}
</style>
