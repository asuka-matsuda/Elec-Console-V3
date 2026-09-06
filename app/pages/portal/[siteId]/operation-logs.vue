<script setup lang="ts">
/**
 * Operation Logs View
 * 送電試験 操作ログ画面
 */
import { computed, onMounted, watch } from 'vue'

import { useHead, useRoute } from '#app'
import { useOperationLogs } from '~/composables/portal/useOperationLogs'

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

const limitOptions = [
  { label: '最新 50 件', value: 50 },
  { label: '最新 100 件', value: 100 },
  { label: '最新 200 件', value: 200 },
]

const formatTimestamp = (ts: string) => {
  if (!ts) return '-'
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')

  return `${y}/${m}/${day} ${hh}:${mm}:${ss}`
}

const getActionBadgeVariant = (action: string) => {
  if (action.includes('確定') || action.includes('完了')) {
    return 'success'
  }
  if (action.includes('解除') || action.includes('削除')) {
    return 'danger'
  }
  if (action.includes('更新') || action.includes('変更') || action.includes('インポート')) {
    return 'info'
  }

  return 'neutral'
}
</script>

<template>
  <div class="p-operation-logs">
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
    <AppPanel variant="hud">
      <div class="p-operation-logs-filters">
        <div class="p-operation-logs-filters__group">
          <label class="p-operation-logs-filters__label">作業者:</label>
          <AppSelect
            v-model="selectedWorker"
            :options="workerOptions"
            class="p-operation-logs-filters__select"
          />
        </div>

        <div class="p-operation-logs-filters__group">
          <label class="p-operation-logs-filters__label">アクション:</label>
          <AppSelect
            v-model="selectedAction"
            :options="actionOptions"
            class="p-operation-logs-filters__select"
          />
        </div>

        <div class="p-operation-logs-filters__group">
          <label class="p-operation-logs-filters__label">対象盤:</label>
          <AppSelect
            v-model="selectedTargetBan"
            :options="targetBanOptions"
            class="p-operation-logs-filters__select"
          />
        </div>

        <div class="p-operation-logs-filters__group">
          <label class="p-operation-logs-filters__label">表示件数:</label>
          <AppSelect
            v-model="limit"
            :options="limitOptions"
            class="p-operation-logs-filters__select p-operation-logs-filters__select--sm"
          />
        </div>

        <div class="p-operation-logs-filters__badge">
          <AppBadge variant="info" size="sm">
            取得件数: {{ logs.length }} 件
          </AppBadge>
        </div>
      </div>
    </AppPanel>

    <!-- ログ一覧テーブル -->
    <div class="p-operation-logs__table-wrapper">
      <AppTable>
        <template #header>
          <tr>
            <th style="width: 170px;">
              日時
            </th>
            <th style="width: 120px;">
              作業者
            </th>
            <th style="width: 140px; text-align: center;">
              アクション
            </th>
            <th style="width: 130px;">
              対象盤
            </th>
            <th style="width: 140px;">
              対象回路
            </th>
            <th>詳細内容</th>
          </tr>
        </template>

        <template #body>
          <tr v-if="logs.length === 0" class="p-operation-logs-empty">
            <td colspan="6" style=" padding: var(--space-6);text-align: center;">
              操作ログが存在しないか、条件に一致するログがありません
            </td>
          </tr>

          <tr
            v-for="item in logs"
            :key="item.id"
            class="p-operation-logs-row"
          >
            <!-- タイムスタンプ -->
            <td>
              <span class="p-operation-logs-cell__time">
                {{ formatTimestamp(item.timestamp) }}
              </span>
            </td>

            <!-- 作業者 -->
            <td>
              <span class="p-operation-logs-cell__worker">
                {{ item.worker || '-' }}
              </span>
            </td>

            <!-- アクション -->
            <td style="text-align: center;">
              <AppBadge :variant="getActionBadgeVariant(item.action)" size="sm">
                {{ item.action }}
              </AppBadge>
            </td>

            <!-- 対象盤 -->
            <td>
              <span class="p-operation-logs-cell__ban">
                {{ item.targetBan || '-' }}
              </span>
            </td>

            <!-- 対象回路 -->
            <td>
              <span class="p-operation-logs-cell__circuit">
                {{ item.targetKairo || '-' }}
              </span>
            </td>

            <!-- 詳細内容 -->
            <td>
              <span class="p-operation-logs-cell__details">
                {{ item.details || '-' }}
              </span>
            </td>
          </tr>
        </template>
      </AppTable>
    </div>
  </div>
</template>

<style scoped lang="scss">
.p-operation-logs {
  @include flex-start-stretch($direction: column);

  gap: var(--space-section-gap);
  height: 100%;

  &__table-wrapper {
    flex: 1;
    min-height: 400px;
  }
}

.p-operation-logs-filters {
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

.p-operation-logs-row {
  transition: background-color 0.15s ease;

  &:hover {
    background-color: rgb(255 255 255 / 3%);
  }
}

.p-operation-logs-cell {
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

.p-operation-logs-empty {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
</style>
