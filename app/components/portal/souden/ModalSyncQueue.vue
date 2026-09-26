<script setup lang="ts">
/**
 * ModalSyncQueue
 * [Organisms] オフライン同期待ちキューの確認・手動同期実行・競合解決を行うモーダルコンポーネント。
 */
import { computed, ref, toRef } from 'vue'

import type { PendingSyncItem, SyncResult } from '~/composables/portal/useOfflineSync'
import { useOfflineSync } from '~/composables/portal/useOfflineSync'
import { formatDateTime } from '~/utils/date'
import { formatPhaseValues } from '~/utils/souden'

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
} = useOfflineSync(siteIdRef)

const syncResult = ref<SyncResult | null>(null)
const conflictItems = computed(() => queue.value.filter(item => item.status === 'conflict'))

const closeModal = () => {
  if (isSyncing.value) return
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
  await resolveConflict(item.id, resolution)
  emit('synced')

  if (queue.value.length === 0) {
    closeModal()
  }
}
</script>

<template>
  <Modal
    v-model="isOpen"
    title="現場データのサーバー同期"
    @close="closeModal"
  >
    <template #actions>
      <Button
        @click="closeModal"
      >
        閉じる
      </Button>

      <Button
        v-if="conflictItems.length === 0 && !syncResult"
        variant="success"
        icon="upload"
        :loading="isSyncing"
        :disabled="pendingCount === 0"
        @click="handleStartSync"
      >
        送信実行
      </Button>
    </template>

    <div class="flex flex-col gap-panel-gap">

      <template v-if="conflictItems.length > 0">
        <div class="flex items-start gap-item-gap p-panel-pad-compact conflict-alert">
          <Icon name="alert-triangle" size="sm" class="shrink-0 mt-0.5" />
          <div>
            <strong>{{ conflictItems.length }}件</strong> の回路で別の作業者との更新競合が発生しました。<br>
            内容を確認し、どちらの値を採用するか選択してください。
          </div>
        </div>

        <div
          v-for="item in conflictItems"
          :key="item.id"
          class="flex flex-col gap-item-gap p-panel-pad-compact conflict-panel"
        >
          <div class="flex items-center gap-item-gap pb-item-gap panel-header">
            <span class="panel-ban">{{ item.banMeisho }}</span>
            <span class="flex-1 panel-kairo">{{ item.kairoBangou }} {{ item.kairoMeisho }}</span>
            <Badge id="souden:phase-warning">
              フェーズ{{ item.phase }}
            </Badge>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-form-col-gap">

            <div class="flex flex-col gap-item-gap p-panel-pad-compact conflict-col server-col">
              <div class="flex items-center gap-inline-gap col-title">
                <Icon name="database" size="sm" />
                <span>サーバー側の最新データ</span>
              </div>
              <div class="col-meta">
                更新日時: {{ formatDateTime(item.serverCircuitData?.updatedAt) }}
              </div>
              <div class="p-item-gap col-details">
                {{ formatPhaseValues(item.phase, item.serverCircuitData, true) }}
              </div>
              <Button
                class="mt-auto"
                @click="handleResolve(item, 'discard')"
              >
                サーバーの値を残す
              </Button>
            </div>

            <div class="flex flex-col gap-item-gap p-panel-pad-compact conflict-col client-col">
              <div class="flex items-center gap-inline-gap col-title">
                <Icon name="user" size="sm" />
                <span>あなたのオフライン入力</span>
              </div>
              <div class="col-meta">
                実測定時刻: {{ formatDateTime(item.clientConfirmedAt) }}
              </div>
              <div class="p-item-gap col-details">
                {{ formatPhaseValues(item.phase, item.payload, false) }}
              </div>
              <Button
                class="mt-auto"
                @click="handleResolve(item, 'overwrite')"
              >
                自分の値で上書きする
              </Button>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="syncResult">
        <div
          class="flex flex-col gap-item-gap p-panel-pad-compact sync-result-box"
          :class="syncResult.errorCount > 0 ? 'is-danger' : 'is-success'"
        >
          <div v-if="syncResult.successCount > 0" class="flex items-center gap-item-gap">
            <Icon name="check-circle" size="sm" />
            <span>{{ syncResult.successCount }} 件のデータを正常に同期しました。</span>
          </div>
          <div v-if="syncResult.errorCount > 0" class="flex items-center gap-item-gap">
            <Icon name="alert-circle" size="sm" />
            <span>{{ syncResult.errorCount }} 件の送信に失敗しました（電波状況を確認してください）。</span>
          </div>
        </div>
      </template>

      <template v-else-if="queue.length > 0">
        <p class="m-0 summary-desc">
          地下受変電室等で記録された <strong>{{ pendingCount }}件</strong> の未送信データがあります。<br>
          現場で実際に測定された正確な時刻（実打鍵タイムスタンプ）とともにサーバーへ反映します。
        </p>

        <ul class="overflow-y-auto flex flex-col gap-inline-gap max-h-[220px] m-0 p-item-gap list-none queue-list">
          <li
            v-for="item in queue"
            :key="item.id"
            class="flex items-center gap-item-gap px-item-gap py-inline-gap queue-item"
          >
            <Badge id="souden:phase-tool">
              P{{ item.phase }}
            </Badge>
            <span class="item-ban">{{ item.banMeisho }}</span>
            <span class="flex-1 item-kairo">{{ item.kairoBangou }} {{ item.kairoMeisho }}</span>
            <span class="item-time">{{ formatDateTime(item.clientConfirmedAt) }}</span>
          </li>
        </ul>
      </template>

      <EmptyState
        v-else
        icon="check-circle"
        title="未送信データはありません"
        description="すべてのデータがサーバーと正常に同期されています。"
      />
    </div>
  </Modal>
</template>

<style scoped lang="scss">
.summary-desc {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  color: var(--color-text-muted);
}

.queue-list {
  border: 1px solid var(--color-border);
  background: var(--surface-bg-solid);
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

.conflict-alert {
  border: 1px solid color-mix(in srgb, var(--color-status-warning) 30%, transparent);

  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  color: var(--color-status-warning);

  background: color-mix(in srgb, var(--color-status-warning) 10%, transparent);
}

.conflict-panel {
  border: 1px solid var(--color-border);
  background: var(--surface-bg-elevated);

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

.conflict-col {
  border: 1px solid var(--color-border);
  background: var(--surface-bg-solid);

  &.server-col {
    border-color: color-mix(in srgb, var(--color-status-neutral) 30%, transparent);
  }

  &.client-col {
    border-color: color-mix(in srgb, var(--theme-accent) 30%, transparent);
    background: color-mix(in srgb, var(--theme-accent) 5%, var(--surface-bg-solid));
  }

  .col-title {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }

  .col-meta {
    font-size: var(--font-size-2xs);
    color: var(--color-text-muted);
  }

  .col-details {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    line-height: var(--line-height-ui);
    color: var(--color-text-muted);

    background: var(--surface-bg-elevated);
  }
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
