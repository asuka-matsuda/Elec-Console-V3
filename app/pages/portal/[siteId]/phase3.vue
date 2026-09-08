<script setup lang="ts">
/**
 * Phase 3 View
 * フェーズ3：送電・電圧測定・検相
 */
import { computed, onMounted, watch } from 'vue'

import { usePhaseExam } from '~/composables/portal/usePhaseExam'
import type { CircuitItem } from '~/types/souden'

useHead({ title: 'フェーズ3：送電・電圧測定・検相 - Elec-Console' })

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
  isCircuitLocked,
  isActionLoading,
  isBatchLoading,
  isThreePhase,
  fetchCircuits,
  confirmPhase3,
  clearPhase3,
  batchConfirmPhase3,
} = usePhaseExam(siteId, initialKeiTo.value, 3)

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
    title="フェーズ3：送電・電圧測定・検相"
    icon="zap"
    :phase="3"
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
        @click="batchConfirmPhase3"
      >
        <AtomsIcon name="check-check" size="sm" />
        一括標準値確定
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

    <PortalPhase3Table
      :circuits="filteredCircuits"
      :is-circuit-locked="isCircuitLocked"
      :is-action-loading="isActionLoading"
      :is-three-phase="isThreePhase"
      @confirm="confirmPhase3"
      @clear="clearPhase3"
    />
  </PortalPhaseExamTemplate>
</template>
