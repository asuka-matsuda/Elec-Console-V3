<script setup lang="ts">
/**
 * Phase 2 View
 * フェーズ2：絶縁抵抗測定（メガ測定）
 */
import { computed, onMounted, watch } from 'vue'

import { usePhase2Exam } from '~/composables/portal/phase/usePhase2Exam'
import type { CircuitItem } from '~/types/souden'

useHead({ title: 'フェーズ2：絶縁抵抗測定 - Elec-Console' })

const route = useRoute()
const siteId = computed(() => route.params.siteId as string)
const initialKeiTo = computed(() => (route.query.kei_to as string) || '幹線')

const {
  circuits,
  filteredCircuits,
  availableShubetsuList,
  availableBanMeishoList,
  selectedKeiTo,
  selectedBanShubetsu,
  selectedBanMeisho,
  phaseStats,
  phase2ThresholdMegOhm,
  isCircuitLocked,
  isActionLoading,
  isBatchLoading,
  isThreePhase,
  evalMegStatus,
  fetchCircuits,
  confirmPhase2,
  clearPhase2,
  batchConfirmPhase2,
} = usePhase2Exam(siteId, initialKeiTo.value)

watch(
  () => route.query.kei_to,
  (newKeiTo) => {
    if (newKeiTo && typeof newKeiTo === 'string') {
      selectedKeiTo.value = newKeiTo
      fetchCircuits()
    }
  },
)

watch(selectedKeiTo, () => {
  selectedBanShubetsu.value = 'ALL'
  selectedBanMeisho.value = 'ALL'
  fetchCircuits()
})

onMounted(() => {
  fetchCircuits()
})

const scrollToCircuit = (circuit: CircuitItem) => {
  scrollToTableRow(circuit.id)
}

const shubetsuTabOptions = computed(() => {
  return availableShubetsuList.value.map(s => ({
    label: s === 'ALL' ? 'すべて' : s,
    value: s,
  }))
})
</script>

<template>
  <PortalTemplatesPhaseExam
    v-model:shubetsu="selectedBanShubetsu"
    v-model:ban-meisho="selectedBanMeisho"
    title="フェーズ2：絶縁抵抗測定"
    icon="activity"
    :phase="2"
    :shubetsu-options="shubetsuTabOptions"
    :ban-meisho-options="availableBanMeishoList"
    :stats="phaseStats"
    :circuits="filteredCircuits"
    @select-circuit="scrollToCircuit"
  >
    <template #header-actions>
      <PortalMoleculesSyncStatusBadge
        :site-id="siteId"
        @synced="fetchCircuits"
      />

      <Button
        variant="success"
        icon="check-check"
        :loading="isBatchLoading"
        @click="batchConfirmPhase2(100)"
      >
        一括 100MΩ(OK) 確定
      </Button>

      <Button
        icon="arrow-left"
        :to="`/portal/${siteId}/souden`"
      >
        ダッシュボードへ戻る
      </Button>
    </template>

    <template #filters-extra>
      <div class="threshold-badge flex items-center gap-1 py-0.5 px-2.5">
        <span class="threshold-label">基準値: ≧</span>
        <span class="threshold-val">{{ phase2ThresholdMegOhm.toFixed(1) }}</span>
        <span class="threshold-unit">MΩ</span>
      </div>
    </template>

    <PortalOrganismsPhase2Table
      :circuits="filteredCircuits"
      :full-circuits="circuits"
      :is-circuit-locked="isCircuitLocked"
      :is-action-loading="isActionLoading"
      :is-three-phase="isThreePhase"
      :phase2-threshold-meg-ohm="phase2ThresholdMegOhm"
      :eval-meg-status="evalMegStatus"
      @confirm="confirmPhase2"
      @clear="clearPhase2"
    />
  </PortalTemplatesPhaseExam>
</template>

<style scoped lang="scss">
.threshold-badge {
  border: 1px solid var(--color-border);
  font-size: var(--font-size-xs);
  background-color: var(--color-bg-hover);
}

.threshold-label {
  color: var(--color-text-muted);
}

.threshold-val {
  font-family: var(--font-mono);
  font-weight: var(--font-weight-bold);
  color: var(--color-category-tool);
}

.threshold-unit {
  color: var(--color-text-muted);
}
</style>
