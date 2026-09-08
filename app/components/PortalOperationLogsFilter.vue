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
  <AppPanel variant="hud" class="portal-operation-logs-filter">
    <div class="logs-filters__group">
      <label class="logs-filters__label">作業者:</label>
      <AtomsSelect
        v-model="selectedWorker"
        :options="workerOptions"
        class="logs-filters__select"
      />
    </div>

    <div class="logs-filters__group">
      <label class="logs-filters__label">アクション:</label>
      <AtomsSelect
        v-model="selectedAction"
        :options="actionOptions"
        class="logs-filters__select"
      />
    </div>

    <div class="logs-filters__group">
      <label class="logs-filters__label">盤:</label>
      <AtomsSelect
        v-model="selectedTargetBan"
        :options="targetBanOptions"
        class="logs-filters__select"
      />
    </div>

    <div class="logs-filters__group">
      <label class="logs-filters__label">表示件数:</label>
      <AtomsSelect
        v-model="limit"
        :options="OPERATION_LOG_LIMIT_OPTIONS"
        class="logs-filters__select logs-filters__select--sm"
      />
    </div>

    <div class="logs-filters__badge">
      <AtomsBadge color="var(--theme-accent)">
        取得件数: {{ logCount }} 件
      </AtomsBadge>
    </div>
  </AppPanel>
</template>

<style scoped lang="scss">
.portal-operation-logs-filter {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: center;

  padding: var(--space-3) var(--space-4);
}

.logs-filters {
  &__group {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }

  &__label {
    font-size: var(--text-xs);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-secondary);
    white-space: nowrap;
  }

  &__select {
    min-width: 140px;

    &--sm {
      min-width: 90px;
    }
  }

  &__badge {
    margin-left: auto;

    @include mq("md") {
      width: 100%;
      margin-left: 0;
    }
  }
}
</style>
