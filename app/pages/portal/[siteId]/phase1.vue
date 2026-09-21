<script setup lang="ts">
/**
 * Phase 1 View
 * フェーズ1：回路確認・増締
 */
import { computed, onMounted, watch } from 'vue'

import { usePhase1Exam } from '~/composables/portal/phase/usePhase1Exam'
import type { CircuitItem } from '~/types/souden'

useHead({ title: 'フェーズ1：回路確認・増締 - Elec-Console' })

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
  fetchCircuits,
  saveEdit,
  confirmPhase1,
  clearPhase1,
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
    title="フェーズ1：回路確認・増締"
    icon="check-square"
    :phase="1"
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

      <Button
        icon="arrow-left"
        :to="`/portal/${siteId}/souden`"
      >
        ダッシュボードへ戻る
      </Button>
    </template>

    <PortalPhase1Table
      :circuits="filteredCircuits"
      :full-circuits="circuits"
      :is-circuit-locked="isCircuitLocked"
      :is-action-loading="isActionLoading"
      @confirm="confirmPhase1"
      @clear="clearPhase1"
      @save-edit="saveEdit"
    />
  </PortalTemplatesPhaseExam>
</template>
