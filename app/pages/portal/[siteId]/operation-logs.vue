<script setup lang="ts">
/**
 * Operation Logs View
 * 送電試験 操作ログ画面
 */
import { computed, onMounted, watch } from 'vue'

import { useHead, useRoute } from '#app'
import { useOperationLogs } from '~/composables/portal/useOperationLogs'

useHead({ title: '送電試験 操作ログ - Elec-Console' })

const route = useRoute()
const siteId = computed(() => route.params.siteId as string)

const {
  logs,
  availableWorkers,
  availableActions,
  availableTargetBans,
  selectedWorker,
  selectedAction,
  selectedTargetBan,
  limit,
  isLoading,
  fetchLogs,
} = useOperationLogs(siteId)

onMounted(() => {
  fetchLogs()
})

watch([selectedWorker, selectedAction, selectedTargetBan, limit], () => {
  fetchLogs()
})

const workerOptions = computed(() => [
  { label: 'すべての作業者', value: 'ALL' },
  ...availableWorkers.value.map(w => ({ label: w, value: w })),
])

const actionOptions = computed(() => [
  { label: 'すべてのアクション', value: 'ALL' },
  ...availableActions.value.map(a => ({ label: a, value: a })),
])

const targetBanOptions = computed(() => [
  { label: 'すべての対象盤', value: 'ALL' },
  ...availableTargetBans.value.map(b => ({ label: b, value: b })),
])
</script>

<template>
  <div class="flex flex-1 flex-col gap-section-gap h-full min-h-0">
    <MoleculesSectionHeader
      title="送電試験 操作ログ"
      icon="history"
      size="lg"
    >
      <template #actions>
        <AtomsButton
          variant="secondary"
          :loading="isLoading"
          @click="fetchLogs"
        >
          <AtomsIcon name="refresh-cw" />
          最新に更新
        </AtomsButton>

        <AtomsButton
          :to="`/portal/${siteId}/souden`"
          variant="secondary"
        >
          <AtomsIcon name="arrow-left" />
          ダッシュボードへ戻る
        </AtomsButton>
      </template>
    </MoleculesSectionHeader>

    <!-- 検索・フィルタリングコントロール (Molecules) -->
    <PortalMoleculesOperationLogsFilter
      v-model:worker="selectedWorker"
      v-model:action="selectedAction"
      v-model:target-ban="selectedTargetBan"
      v-model:limit="limit"
      :worker-options="workerOptions"
      :action-options="actionOptions"
      :target-ban-options="targetBanOptions"
      :log-count="logs.length"
    />

    <!-- ログ一覧テーブル (Organism) -->
    <PortalOrganismsOperationLogsTable
      :logs="logs"
      :is-loading="isLoading"
    />
  </div>
</template>
