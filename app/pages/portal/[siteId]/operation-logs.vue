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
  <div class="operation-logs">
    <AppSectionHeader
      title="送電試験 操作ログ"
      icon="history"
      size="lg"
    >
      <template #actions>
        <AtomsButton
          variant="secondary"
          size="sm"
          :loading="isLoading"
          @click="fetchLogs"
        >
          <AtomsIcon name="refresh-cw" size="sm" />
          最新に更新
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
    </AppSectionHeader>

    <!-- 検索・フィルタリングコントロール (Organism) -->
    <PortalOperationLogsFilter
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
    <PortalOperationLogsTable
      :logs="logs"
      :is-loading="isLoading"
    />
  </div>
</template>

<style scoped lang="scss">
.operation-logs {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-section-gap);

  height: 100%;
  min-height: 0;
}
</style>
