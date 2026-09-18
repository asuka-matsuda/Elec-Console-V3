<script setup lang="ts">
/**
 * PortalOrganismsOperationLogsTable
 * [Portal Organisms] 送電試験操作ログ一覧テーブルコンポーネント。
 * ログ一覧、日時フォーマット、アクション別Badge装飾、およびエンプティステートを管理します。
 */
import { OPERATION_LOG_COLUMNS } from '~/constants/soudenConstants'
import type { BadgePresetId } from '~/types/components'
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

const getActionBadgeId = (action: unknown): BadgePresetId => {
  if (typeof action !== 'string') return 'log:neutral'
  if (action.includes('確定') || action.includes('完了')) {
    return 'log:success'
  }
  if (action.includes('解除') || action.includes('削除')) {
    return 'log:danger'
  }
  if (action.includes('更新') || action.includes('変更') || action.includes('インポート')) {
    return 'log:accent'
  }

  return 'log:neutral'
}
</script>

<template>
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
        <MoleculesEmptyState
          icon="history"
          title="操作ログが存在しません"
          description="条件に一致するログがないか、操作履歴がまだ記録されていません。"
        />
      </template>

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
        <Badge :id="getActionBadgeId(value)">
          {{ value }}
        </Badge>
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
        <span class="block max-w-[300px] logs-cell__details">
          {{ value || '-' }}
        </span>
      </template>
    </Table>
  </div>
</template>

<style scoped lang="scss">
.logs-cell {
  &__time {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    white-space: nowrap;
  }

  &__worker {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-main);
  }

  &__ban {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }

  &__circuit {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
  }

  &__details {
    overflow: hidden;

    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
