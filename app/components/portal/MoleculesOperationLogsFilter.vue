<script setup lang="ts">
/**
 * PortalMoleculesOperationLogsFilter
 * [Portal Molecules] 送電試験操作ログの絞り込みパネルコンポーネント。
 * 作業者、アクション、盤、表示件数の各セレクトと取得件数バッジを提供します。
 */
import { OPERATION_LOG_LIMIT_OPTIONS } from '~/constants/soudenConstants'
import type { SelectOption } from '~/types/components'

const selectedWorker = defineModel<string>('worker', { default: 'ALL' })
const selectedAction = defineModel<string>('action', { default: 'ALL' })
const selectedTargetBan = defineModel<string>('targetBan', { default: 'ALL' })
const limit = defineModel<number>('limit', { default: 50 })

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
      <label class="logs-filters__label">作業者:</label>
      <Select
        v-model="selectedWorker"
        :options="workerOptions"
        class="min-w-[140px]"
      />
    </div>

    <div class="flex items-center gap-2">
      <label class="logs-filters__label">アクション:</label>
      <Select
        v-model="selectedAction"
        :options="actionOptions"
        class="min-w-[140px]"
      />
    </div>

    <div class="flex items-center gap-2">
      <label class="logs-filters__label">盤:</label>
      <Select
        v-model="selectedTargetBan"
        :options="targetBanOptions"
        class="min-w-[140px]"
      />
    </div>

    <div class="flex items-center gap-2">
      <label class="logs-filters__label">表示件数:</label>
      <Select
        v-model="limit"
        :options="OPERATION_LOG_LIMIT_OPTIONS"
        class="min-w-[90px]"
      />
    </div>

    <div class="flex items-center w-full md:w-auto md:ml-auto">
      <span class="logs-count">
        取得件数: <strong class="logs-count__num">{{ logCount }}</strong> 件
      </span>
    </div>
  </Panel>
</template>

<style scoped lang="scss">
.logs-filters__label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.logs-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  white-space: nowrap;

  &__num {
    font-family: var(--font-mono);
    font-weight: var(--font-weight-bold);
    color: var(--theme-accent);
  }
}
</style>
