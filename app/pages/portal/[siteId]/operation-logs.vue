<script setup lang="ts">
/**
 * Operation Logs View
 * 送電試験 操作ログ画面
 */
import { computed, onMounted, watch } from 'vue'

import { useHead, useRoute } from '#app'
import { useOperationLogs } from '~/composables/portal/useOperationLogs'
import {
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

const workerOptions = computed(() => {
  return [
    { label: 'すべての作業者', value: 'ALL' },
    ...availableWorkers.value.map(w => ({ label: w, value: w })),
  ]
})

const actionOptions = computed(() => {
  return [
    { label: 'すべてのアクション', value: 'ALL' },
    ...availableActions.value.map(a => ({ label: a, value: a })),
  ]
})

const targetBanOptions = computed(() => {
  return [
    { label: 'すべての対象盤', value: 'ALL' },
    ...availableTargetBans.value.map(b => ({ label: b, value: b })),
  ]
})

const formatTimestamp = (ts: unknown) => {
  if (!ts || typeof ts !== 'string') return '-'
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')

  return `${y}/${m}/${day} ${hh}:${mm}:${ss}`
}

const getActionBadgeColor = (action: unknown) => {
  if (typeof action !== 'string') return 'var(--color-status-neutral)'
  if (action.includes('確定') || action.includes('完了')) {
    return 'var(--color-status-success)'
  }
  if (action.includes('解除') || action.includes('削除')) {
    return 'var(--color-status-danger)'
  }
  if (action.includes('更新') || action.includes('変更') || action.includes('インポート')) {
    return 'var(--theme-accent)'
  }

  return 'var(--color-status-neutral)'
}
</script>

<template>
  <div class="operation-logs">
    <AppSectionHeader
      title="送電試験 操作ログ"
      icon="history"
      size="lg"
    >
      <template #actions>
        <AppButton
          variant="secondary"
          size="sm"
          :loading="isLoading"
          @click="fetchLogs"
        >
          <AppIcon name="refresh-cw" size="sm" />
          最新に更新
        </AppButton>

        <AppButton
          :to="`/portal/${siteId}/souden`"
          variant="secondary"
          size="sm"
        >
          <AppIcon name="arrow-left" size="sm" />
          ダッシュボードへ戻る
        </AppButton>
      </template>
    </AppSectionHeader>

    <!-- 検索・フィルタリングコントロール -->
    <AppPanel variant="hud" class="logs-filters">
      <div class="logs-filters__group">
        <label class="logs-filters__label">作業者:</label>
        <AppSelect
          v-model="selectedWorker"
          :options="workerOptions"
          class="logs-filters__select"
        />
      </div>

      <div class="logs-filters__group">
        <label class="logs-filters__label">アクション:</label>
        <AppSelect
          v-model="selectedAction"
          :options="actionOptions"
          class="logs-filters__select"
        />
      </div>

      <div class="logs-filters__group">
        <label class="logs-filters__label">盤:</label>
        <AppSelect
          v-model="selectedTargetBan"
          :options="targetBanOptions"
          class="logs-filters__select"
        />
      </div>

      <div class="logs-filters__group">
        <label class="logs-filters__label">表示件数:</label>
        <AppSelect
          v-model="limit"
          :options="OPERATION_LOG_LIMIT_OPTIONS"
          class="logs-filters__select logs-filters__select--sm"
        />
      </div>

      <div class="logs-filters__badge">
        <AppBadge color="var(--theme-accent)">
          取得件数: {{ logs.length }} 件
        </AppBadge>
      </div>
    </AppPanel>

    <!-- ログ一覧テーブル -->
    <AppTable
      v-if="logs.length > 0"
      class="operation-logs__table"
      :columns="OPERATION_LOG_COLUMNS"
      :data="logs"
    >
      <template #cell-timestamp="{ value }">
        <span class="logs-cell__time">
          {{ formatTimestamp(value) }}
        </span>
      </template>

      <template #cell-worker="{ value }">
        <span class="logs-cell__worker">
          {{ value || '-' }}
        </span>
      </template>

      <template #cell-action="{ value }">
        <AppBadge :color="getActionBadgeColor(value)">
          {{ value }}
        </AppBadge>
      </template>

      <template #cell-targetBan="{ value }">
        <span class="logs-cell__ban">
          {{ value || '-' }}
        </span>
      </template>

      <template #cell-targetKairo="{ value }">
        <span class="logs-cell__circuit">
          {{ value || '-' }}
        </span>
      </template>

      <template #cell-details="{ value }">
        <span class="logs-cell__details">
          {{ value || '-' }}
        </span>
      </template>
    </AppTable>

    <!-- ログが存在しない場合のエンプティステート -->
    <AppEmptyState
      v-else-if="!isLoading"
      icon="history"
      title="操作ログが存在しません"
      description="条件に一致するログがないか、操作履歴がまだ記録されていません。"
    />
  </div>
</template>

<style scoped lang="scss">
.operation-logs {
  display: flex;
  flex-direction: column;
  gap: var(--space-section-gap);
  height: 100%;

  &__table {
    flex: 1;
    min-height: 400px;
  }
}

.logs-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: center;

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
    min-width: 150px;

    &--sm {
      min-width: 110px;
    }
  }

  &__badge {
    margin-left: auto;
  }
}

.logs-cell {
  &__time {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  &__worker {
    font-size: var(--text-xs);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }

  &__ban {
    font-size: var(--text-xs);
    color: var(--color-text-main);
  }

  &__circuit {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  &__details {
    font-size: var(--text-xs);
    color: var(--color-text-main);
    word-break: break-all;
  }
}
</style>
