<script setup lang="ts">
/**
 * ModalSyncQueue
 * [Organisms] オフライン同期待ちキューの確認・手動同期実行・競合解決を行うモーダルコンポーネント。
 */
import { computed, ref, toRef } from 'vue'

import type { PendingSyncItem, SyncResult } from '~/composables/portal/useOfflineSync'
import { useOfflineSync } from '~/composables/portal/useOfflineSync'
import { formatDateTime } from '~/utils/date'
import { getPhaseDiffItems } from '~/utils/souden'

const isOpen = defineModel<boolean>({ default: false })

const props = defineProps<{
  siteId: string
}>()

const emit = defineEmits<{
  (e: 'synced'): void
}>()

const siteIdRef = toRef(props, 'siteId')
const {
  queue,
  pendingCount,
  isSyncing,
  syncAll,
  resolveConflict,
  resolveAllConflicts,
} = useOfflineSync(siteIdRef)

const syncResult = ref<SyncResult | null>(null)
const isResolving = ref(false)
const conflictItems = computed(() => queue.value.filter(item => item.status === 'conflict'))

const closeModal = () => {
  if (isSyncing.value || isResolving.value) return
  isOpen.value = false
  syncResult.value = null
}

const handleStartSync = async () => {
  syncResult.value = await syncAll()

  if (syncResult.value.successCount > 0) {
    emit('synced')
  }
}

const handleResolve = async (item: PendingSyncItem, resolution: 'overwrite' | 'discard') => {
  if (isResolving.value) return
  isResolving.value = true

  try {
    await resolveConflict(item.id, resolution)
    emit('synced')

    if (queue.value.length === 0) {
      closeModal()
    }
  }
  finally {
    isResolving.value = false
  }
}

const handleResolveAll = async (resolution: 'overwrite' | 'discard') => {
  if (isResolving.value) return
  isResolving.value = true

  try {
    await resolveAllConflicts(resolution)
    emit('synced')

    if (queue.value.length === 0) {
      closeModal()
    }
  }
  finally {
    isResolving.value = false
  }
}
</script>

<template>
  <Modal v-model="isOpen" title="現場データのサーバー同期" @close="closeModal">
    <template #actions>
      <Button :disabled="isResolving || isSyncing" @click="closeModal">閉じる</Button>

      <Button v-if="conflictItems.length === 0 && !syncResult" variant="primary" icon="upload" :loading="isSyncing" :disabled="pendingCount === 0" @click="handleStartSync">変更を送信する</Button>
    </template>

    <div class="flex flex-col gap-panel-gap">

      <template v-if="conflictItems.length > 0">
        <Note variant="warning">
          <strong>{{ conflictItems.length }}件</strong> の回路で別の作業者との更新競合が発生しました。<br>
          差分内容を確認し、どちらの値を採用するか選択してください。
        </Note>

        <div v-if="conflictItems.length > 1" class="panel p-panel-pad-compact flex items-center justify-between gap-item-gap bulk-bar">
          <span class="bulk-title">全 {{ conflictItems.length }} 件の一括解決:</span>
          <div class="flex items-center gap-inline-gap">
            <Button size="sm" variant="secondary" :loading="isResolving" @click="handleResolveAll('discard')">全件サーバー側を維持</Button>
            <Button size="sm" variant="primary" :loading="isResolving" @click="handleResolveAll('overwrite')">全件自分の値で上書き</Button>
          </div>
        </div>

        <div v-for="item in conflictItems" :key="item.id" class="panel p-panel-pad-compact flex flex-col gap-item-gap conflict-panel">
          <div class="flex items-center gap-item-gap panel-header">
            <span class="panel-ban">{{ item.banMeisho }}</span>
            <span class="flex-1 panel-kairo">{{ item.kairoBangou }} {{ item.kairoMeisho }}</span>
            <Badge variant="amber">フェーズ{{ item.phase }}</Badge>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-item-gap conflict-meta-grid">
            <div class="flex items-center gap-inline-gap meta-item">
              <Icon name="database" size="sm" />
              <span>サーバー側: {{ formatDateTime(item.serverCircuitData?.updatedAt) }}</span>
            </div>
            <div class="flex items-center gap-inline-gap meta-item is-client">
              <Icon name="user" size="sm" />
              <span>オフライン打鍵: {{ formatDateTime(item.clientConfirmedAt) }}</span>
            </div>
          </div>

          <div class="diff-container">
            <table class="diff-table">
              <thead>
                <tr>
                  <th class="th-label">点検・測定項目</th>
                  <th class="th-val">サーバー側の値</th>
                  <th class="th-val">あなたの入力 (オフライン)</th>
                  <th class="th-status">状態</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="diff in getPhaseDiffItems(item.phase, item.serverCircuitData, item.payload)" :key="diff.key" :class="{ 'row-diff': diff.isDifferent }">
                  <td class="td-label">{{ diff.label }}</td>
                  <td class="td-val">{{ diff.serverValue }}</td>
                  <td class="td-val" :class="{ 'client-diff': diff.isDifferent }">{{ diff.clientValue }}</td>
                  <td class="td-status">
                    <Badge v-if="diff.isDifferent" variant="amber">差異</Badge>
                    <span v-else class="status-same">一致</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex items-center justify-end gap-item-gap pt-inline-gap action-row">
            <Button size="sm" variant="secondary" :disabled="isResolving" @click="handleResolve(item, 'discard')">サーバーの値を残す</Button>
            <Button size="sm" variant="primary" :disabled="isResolving" @click="handleResolve(item, 'overwrite')">自分の値で上書きする</Button>
          </div>
        </div>
      </template>

      <template v-else-if="syncResult">
        <div class="flex flex-col gap-item-gap p-panel-pad-compact sync-result-box" :class="syncResult.errorCount > 0 ? 'is-danger' : 'is-success'">
          <div v-if="syncResult.successCount > 0" class="flex items-center gap-item-gap">
            <Icon name="circle-check" size="sm" />
            <span>{{ syncResult.successCount }} 件のデータを正常に同期しました。</span>
          </div>
          <div v-if="syncResult.errorCount > 0" class="flex items-center gap-item-gap">
            <Icon name="circle-alert" size="sm" />
            <span>{{ syncResult.errorCount }} 件の送信に失敗しました（電波状況を確認してください）。</span>
          </div>
        </div>
      </template>

      <template v-else-if="queue.length > 0">
        <p class="summary-desc">
          地下受変電室等で記録された <strong>{{ pendingCount }}件</strong> の未送信データがあります。<br>
          現場で実際に測定された正確な時刻（実打鍵タイムスタンプ）とともにサーバーへ反映します。
        </p>

        <ul class="overflow-y-auto flex flex-col gap-inline-gap max-h-[220px]">
          <li v-for="item in queue" :key="item.id" class="flex items-center gap-item-gap px-item-gap py-inline-gap queue-item">
            <Badge variant="teal">P{{ item.phase }}</Badge>
            <span class="item-ban">{{ item.banMeisho }}</span>
            <span class="flex-1 item-kairo">{{ item.kairoBangou }} {{ item.kairoMeisho }}</span>
            <span class="item-time">{{ formatDateTime(item.clientConfirmedAt) }}</span>
          </li>
        </ul>
      </template>

      <EmptyState v-else icon="circle-check" variant="cleared" title="未送信データはありません" description="すべてのデータがサーバーと正常に同期されています。" />
    </div>
  </Modal>
</template>

<style scoped lang="scss">
.summary-desc {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  color: var(--color-text-muted);
}

.queue-item {
  font-size: var(--font-size-xs);

  .item-ban {
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }

  .item-kairo {
    color: var(--color-text-muted);
  }

  .item-time {
    font-family: var(--font-mono);
    color: var(--color-text-muted);
  }
}

.bulk-bar {
  border: 1px solid color-mix(in srgb, var(--color-status-warning) 30%, var(--color-border));
  background: color-mix(in srgb, var(--color-status-warning) 5%, var(--surface-bg-solid));

  .bulk-title {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }
}

.conflict-panel {
  border: 1px solid color-mix(in srgb, var(--color-status-warning) 30%, var(--color-border));

  .panel-header {
    border-bottom: 1px solid var(--color-border);
  }

  .panel-ban {
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }

  .panel-kairo {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
}

.conflict-meta-grid {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);

  .meta-item {
    padding: var(--spacing-xs) var(--spacing-sm);
    border: 1px solid var(--color-border);
    background: var(--surface-bg-elevated);

    &.is-client {
      border-color: color-mix(in srgb, var(--theme-accent) 25%, var(--color-border));
      color: var(--color-text-main);
    }
  }
}

.diff-container {
  overflow-x: auto;
  border: 1px solid var(--color-border);
}

.diff-table {
  border-collapse: collapse;
  width: 100%;
  font-size: var(--font-size-xs);
  text-align: left;

  th {
    padding: var(--spacing-xs) var(--spacing-sm);
    border-bottom: 1px solid var(--color-border);

    font-weight: var(--font-weight-bold);
    color: var(--color-text-muted);
    white-space: nowrap;

    background: var(--surface-bg-elevated);
  }

  td {
    padding: var(--spacing-xs) var(--spacing-sm);
    border-bottom: 1px solid color-mix(in srgb, var(--color-border) 40%, transparent);
    color: var(--color-text-main);
  }

  .td-val {
    font-family: var(--font-mono);
  }

  tr:last-child td {
    border-bottom: none;
  }

  .row-diff {
    background: color-mix(in srgb, var(--color-status-warning) 5%, transparent);

    .client-diff {
      font-weight: var(--font-weight-bold);
      color: var(--theme-accent);
    }
  }

  .status-same {
    font-size: var(--font-size-2xs);
    color: var(--color-text-muted);
  }

  .th-status,
  .td-status {
    width: 60px;
    text-align: center;
  }
}

.action-row {
  border-top: 1px solid var(--color-border);
}

.sync-result-box {
  border: 1px solid var(--color-border);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);

  &.is-success {
    border-color: color-mix(in srgb, var(--color-status-success) 40%, transparent);
    color: var(--color-status-success);
    background: color-mix(in srgb, var(--color-status-success) 10%, transparent);
  }

  &.is-danger {
    border-color: color-mix(in srgb, var(--color-status-danger) 40%, transparent);
    color: var(--color-status-danger);
    background: color-mix(in srgb, var(--color-status-danger) 10%, transparent);
  }
}
</style>
