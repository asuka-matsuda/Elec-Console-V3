<script setup lang="ts">
/**
 * フェーズ1（回路確認・増締試験）画面
 * フェーズ1：回路確認・増締
 */
import { computed, nextTick, onMounted, watch } from 'vue'

import type { CircuitItem } from '#shared/types/circuit'
import { usePhase1Exam } from '~/composables/portal/phase/usePhaseExam'
import { usePhaseTableForm } from '~/composables/portal/phase/usePhaseTableForm'
import { useOfflineSync } from '~/composables/portal/useOfflineSync'
import { useTableSort } from '~/composables/useTableSort'
import { PHASE1_TABLE_COLUMNS } from '~/constants/soudenConstants'
import { formatShortDateTime } from '~/utils/date'
import { getSoudenRowClass } from '~/utils/souden'
import { scrollToTableRow } from '~/utils/table'

useHead({ title: 'フェーズ1：回路確認・増締 - Elec-Console' })

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
  isActionLoading,
  fetchCircuits,
  confirmPhase1,
} = usePhase1Exam(siteId, initialKeiTo.value)

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

interface Phase1RowForm {
  kakunin: boolean
  mashishime: boolean
  remarks: string
}

const initRowForm = (c: CircuitItem): Phase1RowForm => ({
  kakunin: Boolean(c.p1Kakunin),
  mashishime: Boolean(c.p1Mashishime),
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
  if (circuit.isExcluded) return '除外回路のため入力できません'
  if (isActionLoading.value[circuit.id]) return '通信処理中です'

  return undefined
}

const {
  sortBy,
  sortOrder,
  sortedData: sortedCircuits,
} = useTableSort(filteredCircuits)

const handleConfirmCircuit = (circuit: CircuitItem) => {
  const form = getRowForm(circuit)

  markConfirmedLocally(circuit)
  confirmPhase1(circuit, {
    kakunin: form.kakunin,
    mashishime: form.mashishime,
    remarks: form.remarks,
  })
}

const isComplete = (c: CircuitItem) => {
  if (!isConfirmed(c)) return false

  return Boolean(c.p1Kakunin && c.p1Mashishime)
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
            <label for="filter-ban-p1" class="shrink-0 label">盤名称:</label>
            <Select id="filter-ban-p1" v-model="selectedBanMeisho" :options="availableBanMeishoList" class="w-40" />
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
              <span>フェーズ1 進捗状況</span>
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

        <PortalExamMinimap :circuits="filteredCircuits" :phase="1" @select-circuit="handleSelectCircuit" />
      </div>
    </section>

    <Table v-model:sort-by="sortBy" v-model:sort-order="sortOrder" :columns="PHASE1_TABLE_COLUMNS" :data="sortedCircuits" :row-id="(row) => `row-${row.id}`" :row-class="(row) => getSoudenRowClass(row, { isComplete, editingRowId: null })" class="flex-1 min-h-[400px]">
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

      <template #cell-shadankiShubetsu="{ row: circuit }">
        <span v-if="circuit.shadankiShubetsu" class="cell-shadanki">{{ circuit.shadankiShubetsu }}</span>
        <span v-else class="cell-dash">-</span>
      </template>

      <template #cell-p1ConfirmedAt="{ row: circuit }">
        <div v-if="circuit.p1Worker" class="flex flex-col items-center gap-0.5">
          <span class="cell-worker">{{ circuit.p1Worker }}</span>
          <span class="cell-date">{{ formatShortDateTime(circuit.p1ConfirmedAt) }}</span>
        </div>
        <span v-else class="cell-dash">-</span>
      </template>

      <template #cell-cableList="{ row: circuit }">
        <div class="flex flex-col gap-inline-gap">
          <div class="flex items-center gap-inline-gap">
            <span class="cell-cable">{{ circuit.cableList || '-' }}</span>
            <span v-if="circuit.haisenJousuu" class="cell-jousuu">× {{ circuit.haisenJousuu }}</span>
          </div>
          <span class="cell-setsuchi" :title="circuit.setsuchiList || ''">{{ circuit.setsuchiList || '-' }}</span>
        </div>
      </template>

      <template #cell-p1Kakunin="{ row: circuit }">
        <Tooltip :text="getRowDisabledReason(circuit) || ''" :disabled="!isRowDisabled(circuit)">
          <div class="flex items-center justify-center gap-item-gap">
            <Checkbox v-model="getRowForm(circuit).kakunin" label="確認" color="var(--color-status-success)" :disabled="isRowDisabled(circuit)" />
            <Checkbox v-model="getRowForm(circuit).mashishime" label="増締" color="var(--color-status-success)" :disabled="isRowDisabled(circuit)" />
          </div>
        </Tooltip>
      </template>

      <template #cell-p1Remarks="{ row: circuit }">
        <Textarea v-model="getRowForm(circuit).remarks" size="sm" :rows="1" auto-resize trim placeholder="備考" class="w-full textarea-remarks" :disabled="isRowDisabled(circuit)" />
      </template>

      <template #cell-actions="{ row: circuit }">
        <div class="cell-actions flex items-center justify-center gap-inline-gap whitespace-nowrap">
          <template v-if="isConfirmed(circuit)">
            <Button variant="secondary" size="sm" suffix-icon="arrow-right" :to="`/portal/${circuit.siteId}/phase2?kei_to=${encodeURIComponent(circuit.keiTo || '幹線')}&targetCircuit=${encodeURIComponent(circuit.id)}`">フェーズ2へ進む</Button>
            <Button variant="danger" size="sm" :disabled="circuit.isExcluded || isActionLoading[circuit.id]" @click="handleClearLocally(circuit)">解除する</Button>
          </template>
          <Button v-else variant="primary" size="sm" :disabled="circuit.isExcluded" :loading="isActionLoading[circuit.id]" @click="handleConfirmCircuit(circuit)">確定する</Button>
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

.cell-cable {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-main);
}

.cell-shadanki {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-main);
  white-space: nowrap;
}

.cell-jousuu {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.cell-setsuchi {
  overflow: hidden;

  max-width: 140px;

  font-size: var(--font-size-2xs);
  color: var(--color-text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.textarea-remarks {
  font-size: var(--font-size-xs);
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
