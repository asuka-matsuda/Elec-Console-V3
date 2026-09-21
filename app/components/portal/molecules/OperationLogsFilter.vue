<script setup lang="ts">
/**
 * OperationLogsFilter
 * 送電試験操作ログの絞り込みパネル。作業者・アクション・盤・件数の選択と取得件数表示。
 */
import { OPERATION_LOG_LIMIT_OPTIONS } from '~/constants/soudenConstants'
import type { SelectOption } from '~/types/components'

const worker = defineModel<string>('worker', { default: 'ALL' })
const action = defineModel<string>('action', { default: 'ALL' })
const targetBan = defineModel<string>('targetBan', { default: 'ALL' })
const limit = defineModel<number>('limit', { default: 100 })

defineProps<{
  workerOptions: SelectOption[]
  actionOptions: SelectOption[]
  targetBanOptions: SelectOption[]
  logCount: number
}>()
</script>

<template>
  <Panel class="flex flex-wrap items-center gap-4 px-4 py-3">
    <div class="flex items-center gap-2">
      <span class="filter-label">作業者:</span>
      <Select v-model="worker" :options="workerOptions" class="min-w-[140px]" />
    </div>

    <div class="flex items-center gap-2">
      <span class="filter-label">アクション:</span>
      <Select v-model="action" :options="actionOptions" class="min-w-[140px]" />
    </div>

    <div class="flex items-center gap-2">
      <span class="filter-label">盤:</span>
      <Select v-model="targetBan" :options="targetBanOptions" class="min-w-[140px]" />
    </div>

    <div class="flex items-center gap-2">
      <span class="filter-label">表示件数:</span>
      <Select v-model="limit" :options="OPERATION_LOG_LIMIT_OPTIONS" class="min-w-[90px]" />
    </div>

    <span class="filter-count w-full md:w-auto md:ml-auto">
      取得件数: <strong>{{ logCount }}</strong> 件
    </span>
  </Panel>
</template>

<style scoped>
.filter-label,
.filter-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.filter-label {
  font-weight: var(--font-weight-bold);
}

.filter-count strong {
  font-family: var(--font-mono);
  font-weight: var(--font-weight-bold);
  color: var(--theme-accent);
}
</style>
