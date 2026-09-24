<script setup lang="ts">
/**
 * フェーズ1（回路確認・増締試験）画面
 * フェーズ1：回路確認・増締
 */
import { computed, onMounted, watch } from 'vue'

import { usePhase1Exam } from '~/composables/portal/phase/usePhase1Exam'

useHead({ title: 'フェーズ1：回路確認・増締 - Elec-Console' })

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
  fetchCircuits,
  saveEdit,
  confirmPhase1,
  clearPhase1,
  updateCheck,
} = usePhase1Exam(siteId, initialKeiTo.value)

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
    title="フェーズ1：回路確認・増締"
    icon="check-square"
    :phase="1"
    :shubetsu-options="shubetsuTabOptions"
    :ban-meisho-options="availableBanMeishoList"
    :stats="phaseStats"
    :circuits="filteredCircuits"
    @synced="fetchCircuits"
  >
    <PortalTablePhase1
      :circuits="filteredCircuits"
      :full-circuits="circuits"
      :is-circuit-locked="isCircuitLocked"
      :is-action-loading="isActionLoading"
      @confirm="confirmPhase1"
      @clear="clearPhase1"
      @save-edit="saveEdit"
      @update-check="updateCheck"
    />
  </PortalPhaseExam>
</template>
