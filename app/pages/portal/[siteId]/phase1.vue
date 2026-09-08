<script setup lang="ts">
/**
 * Phase 1 View
 * フェーズ1：回路確認・増し締め
 */
import { computed, onMounted, watch } from 'vue'

import { usePhaseExam } from '~/composables/portal/usePhaseExam'
import type { CircuitItem } from '~/types/souden'

useHead({ title: 'フェーズ1：回路確認・増し締め - Elec-Console' })

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
  editingRowId,
  editForm,
  isActionLoading,
  fetchCircuits,
  startEdit,
  cancelEdit,
  saveEdit,
  confirmPhase1,
  clearPhase1,
} = usePhaseExam(siteId, initialKeiTo.value)

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
    title="フェーズ1：回路確認・増し締め"
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

      <AtomsButton
        :to="`/portal/${siteId}/souden`"
        variant="secondary"
        size="sm"
      >
        <AtomsIcon name="arrow-left" size="sm" />
        ダッシュボードへ戻る
      </AtomsButton>
    </template>

    <PortalPhase1Table
      :circuits="filteredCircuits"
      :is-circuit-locked="isCircuitLocked"
      :is-action-loading="isActionLoading"
      :editing-row-id="editingRowId"
      :edit-form="editForm"
      @confirm="confirmPhase1"
      @clear="clearPhase1"
      @start-edit="startEdit"
      @cancel-edit="cancelEdit"
      @save-edit="saveEdit"
    />
  </PortalPhaseExamTemplate>
</template>
