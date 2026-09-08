<script setup lang="ts">
/**
 * Phase 2 View
 * フェーズ2：絶縁抵抗測定（メガ測定）
 */
import { computed, onMounted, watch } from 'vue'

import { usePhaseExam } from '~/composables/portal/usePhaseExam'
import type { CircuitItem } from '~/types/souden'

useHead({ title: 'フェーズ2：絶縁抵抗測定 - Elec-Console' })

const route = useRoute()
const siteId = computed(() => route.params.siteId as string)
const initialKeiTo = computed(() => (route.query.kei_to as string) || '幹線')

const {
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
} = usePhaseExam(siteId, initialKeiTo.value, 2)

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
  const el = document.getElementById(`row-${circuit.id}`)

  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('is-highlighted')
    setTimeout(() => el.classList.remove('is-highlighted'), 2000)
  }
}

const shubetsuTabOptions = computed(() => {
  return availableShubetsuList.value.map(s => ({
    label: s === 'ALL' ? 'すべて' : s,
    value: s,
  }))
})
</script>

<template>
  <PortalPhaseExamTemplate
    v-model:shubetsu="selectedBanShubetsu"
    v-model:ban-meisho="selectedBanMeisho"
    title="フェーズ2：絶縁抵抗測定（メガ測定）"
    icon="activity"
    :phase="2"
    :shubetsu-options="shubetsuTabOptions"
    :ban-meisho-options="availableBanMeishoList"
    :stats="phaseStats"
    :circuits="filteredCircuits"
    @select-circuit="scrollToCircuit"
  >
    <template #header-actions>
      <PortalSyncStatusBadge
        :site-id="siteId"
        @synced="fetchCircuits"
      />

      <AtomsButton
        variant="primary"
        size="sm"
        :loading="isBatchLoading"
        @click="batchConfirmPhase2(100)"
      >
        <AtomsIcon name="check-check" size="sm" />
        一括 100MΩ(OK) 確定
      </AtomsButton>

      <AtomsButton
        :to="`/portal/${siteId}/souden`"
        variant="secondary"
        size="sm"
      >
        <AtomsIcon name="arrow-left" size="sm" />
        ダッシュボードへ戻る
      </AtomsButton>
    </template>

    <template #filters-extra>
      <div class="phase2-threshold">
        <span class="phase2-threshold__label">基準値: ≧</span>
        <span class="phase2-threshold__val">{{ phase2ThresholdMegOhm.toFixed(1) }}</span>
        <span class="phase2-threshold__unit">MΩ</span>
      </div>
    </template>

    <PortalPhase2Table
      :circuits="filteredCircuits"
      :is-circuit-locked="isCircuitLocked"
      :is-action-loading="isActionLoading"
      :is-three-phase="isThreePhase"
      :phase2-threshold-meg-ohm="phase2ThresholdMegOhm"
      :eval-meg-status="evalMegStatus"
      @confirm="confirmPhase2"
      @clear="clearPhase2"
    />
  </PortalPhaseExamTemplate>
</template>

<style scoped lang="scss">
.phase2-threshold {
  display: flex;
  gap: 4px;
  align-items: center;

  padding: 2px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);

  font-size: var(--text-xs);

  background-color: var(--color-bg-hover);

  &__label {
    color: var(--color-text-muted);
  }

  &__val {
    font-family: var(--font-mono);
    font-weight: var(--font-weight-bold);
    color: var(--color-category-tool);
  }

  &__unit {
    color: var(--color-text-muted);
  }
}
</style>
