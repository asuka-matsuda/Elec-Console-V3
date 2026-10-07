<script setup lang="ts">
/**
 * 送電試験 操作ログ確認画面
 * 送電試験 操作ログ画面
 */
import { computed, onMounted } from 'vue'

import { useHead, useRoute } from '#app'
import { useOperationLogs } from '~/composables/portal/useOperationLogs'
import {
  getActionBadgeVariant,
  OPERATION_LOG_COLUMNS,
  OPERATION_LOG_LIMIT_OPTIONS,
} from '~/constants/soudenConstants'

useHead({ title: '送電試験 操作ログ - Elec-Console' })

const route = useRoute()
const siteId = computed(() => route.params.siteId as string)

const {
  logs,
  workerOptions,
  actionOptions,
  targetBanOptions,
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
</script>

<template>
  <div class="flex flex-1 flex-col gap-panel-gap h-full min-h-0">
    <!-- フィルター & 操作ツールバー -->
    <div class="panel p-panel-pad-compact flex flex-wrap items-center gap-panel-gap">
      <div class="flex items-center gap-inline-gap">
        <label for="filter-worker" class="shrink-0">作業者</label>
        <Select id="filter-worker" v-model="selectedWorker" :options="workerOptions" class="min-w-[140px]" />
      </div>

      <div class="flex items-center gap-inline-gap">
        <label for="filter-action" class="shrink-0">アクション</label>
        <Select id="filter-action" v-model="selectedAction" :options="actionOptions" class="min-w-[140px]" />
      </div>

      <div class="flex items-center gap-inline-gap">
        <label for="filter-target-ban" class="shrink-0">盤</label>
        <Select id="filter-target-ban" v-model="selectedTargetBan" :options="targetBanOptions" class="min-w-[140px]" />
      </div>

      <div class="flex items-center gap-inline-gap">
        <label for="filter-limit" class="shrink-0">表示件数</label>
        <Select id="filter-limit" v-model="limit" :options="OPERATION_LOG_LIMIT_OPTIONS" class="min-w-[90px]" />
      </div>

      <!-- 右端: 取得件数 & 更新ボタン -->
      <div class="w-full md:w-auto md:ml-auto flex items-center gap-item-gap">
        <span class="whitespace-nowrap">取得件数: <strong>{{ logs.length }}</strong> 件</span>
        <Button variant="secondary" size="sm" icon="refresh-cw" :loading="isLoading" @click="fetchLogs">最新に更新</Button>
      </div>
    </div>

    <!-- ログテーブル -->
    <Table class="flex-1 min-h-[400px]" :columns="OPERATION_LOG_COLUMNS" :data="logs" :loading="isLoading" loading-text="操作ログを読み込み中...">
      <template #empty>
        <EmptyState icon="history" variant="no-results" title="操作ログが存在しません" description="条件に一致するログがないか、操作履歴がまだ記録されていません。" />
      </template>

      <template #cell-action="{ value }">
        <Badge :variant="getActionBadgeVariant(value)">{{ value }}</Badge>
      </template>
    </Table>
  </div>
</template>
