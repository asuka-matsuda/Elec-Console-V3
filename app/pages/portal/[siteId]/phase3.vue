<script setup lang="ts">
/**
 * Phase 3 View
 * フェーズ3：送電・電圧測定・検相
 */
import { computed, onMounted, watch } from 'vue'

import { usePhase3Exam } from '~/composables/portal/phase/usePhase3Exam'
import type { CircuitItem } from '~/types/souden'

useHead({ title: 'フェーズ3：送電・電圧測定・検相 - Elec-Console' })

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
  isCircuitLocked,
  isActionLoading,
  isBatchLoading,
  isThreePhase,
  fetchCircuits,
  confirmPhase3,
  clearPhase3,
  batchConfirmPhase3,
} = usePhase3Exam(siteId, initialKeiTo.value)

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
      <PortalMoleculesSyncStatusBadge
        :site-id="siteId"
        @synced="fetchCircuits"
      />

      <Button
        variant="success"
        icon="check-check"
        :loading="isBatchLoading"
        @click="batchConfirmPhase3"
      >
        一括標準値確定
      </Button>

      <Button
        icon="arrow-left"
        :to="`/portal/${siteId}/souden`"
      >
        ダッシュボードへ戻る
      </Button>
    </template>

    <PortalOrganismsPhase3Table
      :circuits="filteredCircuits"
      :full-circuits="circuits"
      :is-circuit-locked="isCircuitLocked"
      :is-action-loading="isActionLoading"
      :is-three-phase="isThreePhase"
      @confirm="confirmPhase3"
      @clear="clearPhase3"
    />
  </PortalTemplatesPhaseExam>
</template>
