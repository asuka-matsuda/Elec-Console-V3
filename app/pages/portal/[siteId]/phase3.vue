<script setup lang="ts">
/**
 * フェーズ3（送電・電圧測定・検相試験）画面
 * フェーズ3：送電・電圧測定・検相
 */
import { computed, onMounted, watch } from 'vue'

import { usePhase3Exam } from '~/composables/portal/phase/usePhase3Exam'

useHead({ title: 'フェーズ3：送電・電圧測定・検相 - Elec-Console' })

const route = useRoute()
const siteId = computed(() => route.params.siteId as string)
const initialKeiTo = computed(() => (route.query.kei_to as string) || '幹線')

const {
  circuits,
  filteredCircuits,
  shubetsuTabOptions,
  availableBanMeishoList,
  selectedKeiTo,
  selectedBanShubetsu,
  selectedBanMeisho,
  phaseStats,
  isCircuitLocked,
  isActionLoading,
  isThreePhase,
  fetchCircuits,
  confirmPhase3,
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

onMounted(() => {
  fetchCircuits()
})
</script>

<template>
  <PortalPhaseExam
    v-model:shubetsu="selectedBanShubetsu"
    v-model:ban-meisho="selectedBanMeisho"
    title="フェーズ3：送電・電圧測定・検相"
    icon="zap"
    :phase="3"
    :shubetsu-options="shubetsuTabOptions"
    :ban-meisho-options="availableBanMeishoList"
    :stats="phaseStats"
    :circuits="filteredCircuits"
    @synced="fetchCircuits"
  >
    <PortalTablePhase3
      :circuits="filteredCircuits"
      :full-circuits="circuits"
      :is-circuit-locked="isCircuitLocked"
      :is-action-loading="isActionLoading"
      :is-three-phase="isThreePhase"
      @confirm="confirmPhase3"
    />
  </PortalPhaseExam>
</template>
