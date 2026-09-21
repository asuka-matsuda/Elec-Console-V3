<script setup lang="ts">
/**
 * Operation Logs View
 * 送電試験 操作ログ画面
 */
import { computed, onMounted, watch } from 'vue'

import { useHead, useRoute } from '#app'
import { useOperationLogs } from '~/composables/portal/useOperationLogs'
import {
  getActionBadgeId,
  OPERATION_LOG_COLUMNS,
  OPERATION_LOG_LIMIT_OPTIONS,
} from '~/constants/soudenConstants'

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
    <SectionHeader
      title="送電試験 操作ログ"
      icon="history"
    >
      <template #actions>
        <Button
          icon="refresh-cw"
          :loading="isLoading"
          @click="fetchLogs"
        >
          最新に更新
        </Button>

        <Button
          icon="arrow-left"
          :to="`/portal/${siteId}/souden`"
        >
          ダッシュボードへ戻る
        </Button>
      </template>
    </SectionHeader>

    <!-- 検索・フィルタリングコントロール（インライン直結） -->
    <Panel class="flex flex-wrap items-center gap-4 px-4 py-3">
      <div class="flex items-center gap-2">
        <span class="shrink-0">作業者:</span>
        <Select v-model="selectedWorker" :options="workerOptions" class="min-w-[140px]" />
      </div>

      <div class="flex items-center gap-2">
        <span class="shrink-0">アクション:</span>
        <Select v-model="selectedAction" :options="actionOptions" class="min-w-[140px]" />
      </div>

      <div class="flex items-center gap-2">
        <span class="shrink-0">盤:</span>
        <Select v-model="selectedTargetBan" :options="targetBanOptions" class="min-w-[140px]" />
      </div>

      <div class="flex items-center gap-2">
        <span class="shrink-0">表示件数:</span>
        <Select v-model="limit" :options="OPERATION_LOG_LIMIT_OPTIONS" class="min-w-[90px]" />
      </div>

      <span class="w-full md:w-auto md:ml-auto whitespace-nowrap">
        取得件数: <strong>{{ logs.length }}</strong> 件
      </span>
    </Panel>

    <!-- ログ一覧テーブル（インライン直結） -->
    <div class="flex flex-1 flex-col min-h-0">
      <Table
        class="flex-1 min-h-[400px]"
        :columns="OPERATION_LOG_COLUMNS"
        :data="logs"
        :loading="isLoading"
        loading-text="操作ログを読み込み中..."
        empty-text="操作ログが存在しません"
      >
        <template #empty>
          <EmptyState
            icon="history"
            title="操作ログが存在しません"
            description="条件に一致するログがないか、操作履歴がまだ記録されていません。"
          />
        </template>

        <template #cell-action="{ value }">
          <Badge :id="getActionBadgeId(String(value))">
            {{ value }}
          </Badge>
        </template>
      </Table>
    </div>
  </div>
</template>
