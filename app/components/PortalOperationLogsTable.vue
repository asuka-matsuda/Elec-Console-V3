<script setup lang="ts">
/**
 * PortalOperationLogsTable
 * 送電試験操作ログ一覧テーブルOrganismコンポーネント。
 * ログ一覧、日時フォーマット、アクション別AtomsBadge装飾、およびエンプティステートを管理します。
 */
import { OPERATION_LOG_COLUMNS } from '~/constants/soudenConstants'
import type { OperationLogItem } from '~/types/souden'

defineProps<{
  logs: OperationLogItem[]
  isLoading: boolean
}>()

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
  <div class="portal-operation-logs-table">
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
        <AtomsBadge :color="getActionBadgeColor(value)">
          {{ value }}
        </AtomsBadge>
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
.portal-operation-logs-table {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.operation-logs__table {
  flex: 1;
  min-height: 400px;
}

.logs-cell {
  &__time {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    white-space: nowrap;
  }

  &__worker {
    font-size: var(--text-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-main);
  }

  &__ban {
    font-size: var(--text-xs);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }

  &__circuit {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  &__details {
    overflow: hidden;
    display: block;

    max-width: 300px;

    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
