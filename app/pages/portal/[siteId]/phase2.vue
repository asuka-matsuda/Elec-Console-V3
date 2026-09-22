<script setup lang="ts">
/**
 * Phase 2 View
 * フェーズ2：絶縁抵抗測定（メガ測定）
 */
import { computed, onMounted, watch } from 'vue'

import { usePhase2Exam } from '~/composables/portal/phase/usePhase2Exam'

useHead({ title: 'フェーズ2：絶縁抵抗測定 - Elec-Console' })

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

onMounted(() => {
  fetchCircuits()
})
</script>

<template>
  <PortalPhaseExam
    v-model:shubetsu="selectedBanShubetsu"
    v-model:ban-meisho="selectedBanMeisho"
    title="フェーズ2：絶縁抵抗測定"
    icon="activity"
    :phase="2"
    :shubetsu-options="shubetsuTabOptions"
    :ban-meisho-options="availableBanMeishoList"
    :stats="phaseStats"
    :circuits="filteredCircuits"
    @synced="fetchCircuits"
  >
    <template #actions>
      <Button
        variant="success"
        icon="check-check"
        :loading="isBatchLoading"
        @click="batchConfirmPhase2(100)"
      >
        一括 100MΩ(OK) 確定
      </Button>
    </template>

    <template #filters-extra>
      <Badge color="var(--color-category-tool)">
        基準値: ≧ {{ phase2ThresholdMegOhm.toFixed(1) }} MΩ
      </Badge>
    </template>

    <PortalTablePhase2
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
  </PortalPhaseExam>
</template>
