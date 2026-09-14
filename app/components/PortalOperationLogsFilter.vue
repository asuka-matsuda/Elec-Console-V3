<script setup lang="ts">
/**
 * PortalOperationLogsFilter
 * 送電試験操作ログの絞り込みパネルOrganismコンポーネント。
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
  <AtomsPanel class="flex flex-wrap items-center gap-4 px-4 py-3">
    <div class="flex items-center gap-2">
      <label class="logs-filters__label">作業者:</label>
      <AtomsSelect
        v-model="selectedWorker"
        :options="workerOptions"
        class="min-w-[140px]"
      />
    </div>

    <div class="flex items-center gap-2">
      <label class="logs-filters__label">アクション:</label>
      <AtomsSelect
        v-model="selectedAction"
        :options="actionOptions"
        class="min-w-[140px]"
      />
    </div>

    <div class="flex items-center gap-2">
      <label class="logs-filters__label">盤:</label>
      <AtomsSelect
        v-model="selectedTargetBan"
        :options="targetBanOptions"
        class="min-w-[140px]"
      />
    </div>

    <div class="flex items-center gap-2">
      <label class="logs-filters__label">表示件数:</label>
      <AtomsSelect
        v-model="limit"
        :options="OPERATION_LOG_LIMIT_OPTIONS"
        class="min-w-[90px]"
      />
    </div>

    <div class="w-full md:w-auto md:ml-auto">
      <AtomsBadge color="var(--theme-accent)">
        取得件数: {{ logCount }} 件
      </AtomsBadge>
    </div>
  </AtomsPanel>
</template>

<style scoped lang="scss">
.logs-filters__label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
  white-space: nowrap;
}
</style>
