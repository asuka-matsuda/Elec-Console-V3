<script setup lang="ts">
/**
 * フェーズ1（回路確認・増締試験）画面
 * フェーズ1：回路確認・増締
 */
import { computed, onMounted } from 'vue'

import type { CircuitItem } from '#shared/types/circuit'
import { isPhase1Complete } from '#shared/utils/soudenExam'
import { usePhase1Exam } from '~/composables/portal/phase/usePhaseExam'
import { usePhasePageSync } from '~/composables/portal/phase/usePhasePageSync'
import { usePhaseTableForm } from '~/composables/portal/phase/usePhaseTableForm'
import { useTableSort } from '~/composables/useTableSort'
import { PHASE1_TABLE_COLUMNS } from '~/constants/soudenConstants'
import type { TableColumn } from '~/types/components'
import { formatShortDateTime } from '~/utils/date'
import { getSoudenRowClass } from '~/utils/souden'

useHead({ title: 'フェーズ1：回路確認・増締 - Elec-Console' })

const route = useRoute()
const siteId = computed(() => route.params.siteId as string)
const initialKeiTo = computed(() => (route.query.kei_to as string) || '幹線')

const {
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
  fetchCircuits,
  saveExcludedRemarks,
  confirmPhase1,
} = usePhase1Exam(siteId, initialKeiTo.value)

const { handleSelectCircuit } = usePhasePageSync({
  siteId,
  selectedKeiTo,
  selectedBanMeisho,
  filteredCircuits,
  fetchCircuits,
})

interface Phase1RowForm {
  kakunin: boolean
  mashishime: boolean
  mashishimeCubicle: boolean
  remarks: string
}

const initRowForm = (c: CircuitItem): Phase1RowForm => ({
  kakunin: Boolean(c.p1Kakunin),
  mashishime: Boolean(c.p1Mashishime),
  mashishimeCubicle: Boolean(c.p1MashishimeCubicle),
  remarks: c.p1Remarks ?? '',
})

const {
  getRowForm,
  handleClearLocally,
  markConfirmedLocally,
  isConfirmed,
  isRowDisabled,
} = usePhaseTableForm<Phase1RowForm>({
  circuits: () => filteredCircuits.value,
  initForm: initRowForm,
  isConfirmedServer: c => Boolean(c.p1ConfirmedAt),
  isActionLoading: () => isActionLoading.value,
})

const getRowDisabledReason = (circuit: CircuitItem): string | undefined => {
  if (isConfirmed(circuit)) return '確定済みのため入力はロックされています'
  if (circuit.isExcluded) return '除外回路のため測定項目は入力できません（備考のみ保存可能）'
  if (isActionLoading.value[circuit.id]) return '通信処理中です'

  return undefined
}

const {
  sortBy,
  sortOrder,
  sortedData: sortedCircuits,
} = useTableSort(filteredCircuits)

const handleConfirmCircuit = (circuit: CircuitItem) => {
  if (isRowDisabled(circuit)) return
  const form = getRowForm(circuit)

  markConfirmedLocally(circuit)
  confirmPhase1(circuit, {
    kakunin: form.kakunin,
    mashishime: form.mashishime,
    mashishimeCubicle: form.mashishimeCubicle,
    remarks: form.remarks,
  })
}

const handleSaveExcludedRemarks = (circuit: CircuitItem) => {
  const form = getRowForm(circuit)

  saveExcludedRemarks(circuit, form.remarks)
}

const isComplete = (c: CircuitItem) => {
  if (!isConfirmed(c)) return false

  return isPhase1Complete(c)
}

const phase1Columns = computed<TableColumn<CircuitItem>[]>(() => {
  const isKansen = selectedKeiTo.value === '幹線'

  return PHASE1_TABLE_COLUMNS.map((col) => {
    if (col.key === 'p1Kakunin') {
      return {
        ...col,
        label: isKansen ? 'サイズ確認 / キュービクル / 負荷側' : 'サイズ確認 / 増締',
        minWidth: isKansen ? '260px' : '150px',
      }
    }

    return col
  })
})

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
            <label for="filter-area-p1" class="shrink-0 label">エリア:</label>
            <Select id="filter-area-p1" v-model="selectedFloor" :options="availableFloorList" class="w-40" />
          </div>

          <div class="flex items-center gap-item-gap">
            <label for="filter-ban-p1" class="shrink-0 label">盤名称:</label>
            <Select id="filter-ban-p1" v-model="selectedBanMeisho" :options="availableBanMeishoList" class="w-40" />
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
              <span>フェーズ1 進捗状況</span>
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

        <PortalExamMinimap :circuits="filteredCircuits" :phase="1" :loading="isLoading" @select-circuit="handleSelectCircuit" />
      </div>
    </section>

    <Table v-model:sort-by="sortBy" v-model:sort-order="sortOrder" :columns="phase1Columns" :data="sortedCircuits" :loading="isLoading" :skeleton-rows="8" :row-id="(row) => `row-${row.id}`" :row-class="(row) => getSoudenRowClass(row, { isComplete, editingRowId: null })" class="flex-1 min-h-[400px]">
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

      <template #cell-shadankiShubetsu="{ row: circuit }">
        <span v-if="circuit.shadankiShubetsu" class="whitespace-nowrap">{{ circuit.shadankiShubetsu }}</span>
        <small v-else>-</small>
      </template>

      <template #cell-p1ConfirmedAt="{ row: circuit }">
        <div v-if="circuit.p1Worker" class="flex flex-col items-center gap-micro-gap">
          <strong>{{ circuit.p1Worker }}</strong>
          <time>{{ formatShortDateTime(circuit.p1ConfirmedAt) }}</time>
        </div>
        <small v-else>-</small>
      </template>

      <template #cell-cableList="{ row: circuit }">
        <div class="flex flex-col gap-inline-gap">
          <div class="flex items-center gap-inline-gap">
            <span>{{ circuit.cableList || '-' }}</span>
            <small v-if="circuit.haisenJousuu">× {{ circuit.haisenJousuu }}</small>
          </div>
          <small :title="circuit.setsuchiList || ''">{{ circuit.setsuchiList || '-' }}</small>
        </div>
      </template>

      <template #cell-p1Kakunin="{ row: circuit }">
        <Tooltip :text="getRowDisabledReason(circuit) || ''" :disabled="!isRowDisabled(circuit)">
          <div class="flex items-center justify-center gap-item-gap">
            <Checkbox v-model="getRowForm(circuit).kakunin" label="確認" color="var(--color-status-success)" :disabled="isRowDisabled(circuit)" />
            <template v-if="circuit.keiTo === '幹線'">
              <Checkbox v-model="getRowForm(circuit).mashishimeCubicle" label="キュービクル" color="var(--color-status-success)" :disabled="isRowDisabled(circuit)" />
              <Checkbox v-model="getRowForm(circuit).mashishime" label="負荷側" color="var(--color-status-success)" :disabled="isRowDisabled(circuit)" />
            </template>
            <template v-else>
              <Checkbox v-model="getRowForm(circuit).mashishime" label="増締" color="var(--color-status-success)" :disabled="isRowDisabled(circuit)" />
            </template>
          </div>
        </Tooltip>
      </template>

      <template #cell-p1Remarks="{ row: circuit }">
        <Textarea v-model="getRowForm(circuit).remarks" size="sm" :rows="1" auto-resize trim placeholder="備考" class="w-full" :disabled="(!circuit.isExcluded && isConfirmed(circuit)) || Boolean(isActionLoading[circuit.id])" />
      </template>

      <template #cell-actions="{ row: circuit }">
        <div class="flex items-center justify-center gap-inline-gap whitespace-nowrap">
          <template v-if="circuit.isExcluded">
            <Badge variant="gray">除外</Badge>
            <Button variant="secondary" size="sm" :loading="Boolean(isActionLoading[circuit.id])" @click="handleSaveExcludedRemarks(circuit)">備考保存</Button>
          </template>
          <template v-else-if="isConfirmed(circuit)">
            <Button variant="secondary" size="sm" suffix-icon="arrow-right" :to="`/portal/${circuit.siteId}/phase2?kei_to=${encodeURIComponent(circuit.keiTo || '幹線')}&targetCircuit=${encodeURIComponent(circuit.id)}`">フェーズ2へ進む</Button>
            <Button variant="danger" size="sm" :disabled="Boolean(isActionLoading[circuit.id])" @click="handleClearLocally(circuit)">解除する</Button>
          </template>
          <Button v-else variant="primary" size="sm" :loading="Boolean(isActionLoading[circuit.id])" @click="handleConfirmCircuit(circuit)">確定する</Button>
        </div>
      </template>
    </Table>
  </div>
</template>
