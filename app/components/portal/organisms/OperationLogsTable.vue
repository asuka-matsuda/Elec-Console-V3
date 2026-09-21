<script setup lang="ts">
/**
 * PortalOrganismsOperationLogsTable
 * [Portal Organisms] 送電試験操作ログ一覧テーブルコンポーネント。
 * アクション種別のバッジ装飾およびエンプティ表示のみを担い、セル描画・省略・フォールバックは Table/TableTd に委任します。
 */
import { getActionBadgeId, OPERATION_LOG_COLUMNS } from '~/constants/soudenConstants'
import type { OperationLogItem } from '~/types/souden'

defineProps<{
  logs: OperationLogItem[]
  isLoading: boolean
}>()
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
        <EmptyState
          icon="history"
          title="操作ログが存在しません"
          description="条件に一致するログがないか、操作履歴がまだ記録されていません。"
        />
      </template>

      <template #cell-action="{ value }">
        <Badge :id="getActionBadgeId(value)">
          {{ value }}
        </Badge>
      </template>
    </Table>
  </div>
</template>
