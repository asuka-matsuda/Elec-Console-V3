<script setup lang="ts">
/**
 * PortalOrganismsSyncQueueModal
 * [Organisms] オフライン同期待ちキューの確認・手動同期実行・競合解決を行うモーダルコンポーネント。
 */
import { computed, ref, toRef } from 'vue'

import type { PendingSyncItem, SyncResult } from '~/composables/portal/useOfflineSync'
import { useOfflineSync } from '~/composables/portal/useOfflineSync'

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
const selectedConflictItem = ref<PendingSyncItem | null>(null)

const conflictItems = computed(() => queue.value.filter(item => item.status === 'conflict'))

const closeModal = () => {
  if (isSyncing.value) return
  isOpen.value = false
  syncResult.value = null
  selectedConflictItem.value = null
}

const handleStartSync = async () => {
  syncResult.value = await syncAll()

  if (syncResult.value.successCount > 0) {
    emit('synced')
  }

  if (conflictItems.value.length > 0) {
    selectedConflictItem.value = conflictItems.value[0] || null
  }
}

const handleResolve = async (item: PendingSyncItem, resolution: 'overwrite' | 'discard') => {
  await resolveConflict(item.id, resolution)
  emit('synced')

  selectedConflictItem.value = conflictItems.value[0] || null

  if (queue.value.length === 0) {
    closeModal()
  }
}

const formatDateTime = (isoStr: string) => {
  if (!isoStr) return '-'
  const d = new Date(isoStr)

  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}
</script>

<template>
  <OrganismsModal
    v-model="isOpen"
    title="現場データのサーバー同期"
    @close="closeModal"
  >
    <div class="flex flex-col gap-4">
      <!-- 競合解決ビュー -->
      <template v-if="conflictItems.length > 0">
        <div class="flex items-start gap-2 p-3 conflict-alert">
          <AtomsIcon name="alert-triangle" size="sm" class="shrink-0 mt-0.5" />
          <div>
            <strong>{{ conflictItems.length }}件</strong> の回路で別の作業者との更新競合が発生しました。<br>
            内容を確認し、どちらの値を採用するか選択してください。
          </div>
        </div>

        <div
          v-for="item in conflictItems"
          :key="item.id"
          class="flex flex-col gap-2 p-3 conflict-card"
        >
          <div class="flex items-center gap-2 pb-2 card-header">
            <span class="card-ban">{{ item.banMeisho }}</span>
            <span class="flex-1 card-kairo">{{ item.kairoBangou }} {{ item.kairoMeisho }}</span>
            <AtomsBadge color="var(--color-status-warning)">
              フェーズ{{ item.phase }}
            </AtomsBadge>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- サーバー側の値 -->
            <div class="flex flex-col gap-2 p-3 conflict-col server-col">
              <div class="flex items-center gap-1.5 col-title">
                <AtomsIcon name="database" size="sm" />
                <span>サーバー側の最新データ</span>
              </div>
              <div class="col-meta">
                更新日時: {{ formatDateTime(String(item.serverCircuitData?.updatedAt || '')) }}
              </div>
              <div class="p-2 col-details">
                <template v-if="item.phase === 1">
                  確認: {{ item.serverCircuitData?.p1Kakunin ? '済' : '未' }} / 増締: {{ item.serverCircuitData?.p1Mashishime ? '済' : '未' }}
                </template>
                <template v-else-if="item.phase === 2">
                  R: {{ item.serverCircuitData?.zetsuenR ?? '-' }}MΩ / S: {{ item.serverCircuitData?.zetsuenS ?? '-' }}MΩ / T: {{ item.serverCircuitData?.zetsuenT ?? '-' }}MΩ
                </template>
                <template v-else-if="item.phase === 3">
                  RS: {{ item.serverCircuitData?.denatsuRs ?? '-' }}V / ST: {{ item.serverCircuitData?.denatsuSt ?? '-' }}V / TR: {{ item.serverCircuitData?.denatsuRt ?? '-' }}V
                </template>
              </div>
              <AtomsButton
                variant="secondary"
                class="mt-2"
                @click="handleResolve(item, 'discard')"
              >
                サーバーの値を残す
              </AtomsButton>
            </div>

            <!-- 端末側（オフライン入力）の値 -->
            <div class="flex flex-col gap-2 p-3 conflict-col client-col">
              <div class="flex items-center gap-1.5 col-title">
                <AtomsIcon name="user" size="sm" />
                <span>あなたのオフライン入力</span>
              </div>
              <div class="col-meta">
                実測定時刻: {{ formatDateTime(item.clientConfirmedAt) }}
              </div>
              <div class="p-2 col-details">
                <template v-if="item.phase === 1">
                  確認: {{ item.payload.kakunin ? '済' : '未' }} / 増締: {{ item.payload.mashishime ? '済' : '未' }}
                </template>
                <template v-else-if="item.phase === 2">
                  R: {{ item.payload.rVal ?? '-' }}MΩ / S: {{ item.payload.sVal ?? '-' }}MΩ / T: {{ item.payload.tVal ?? '-' }}MΩ
                </template>
                <template v-else-if="item.phase === 3">
                  RS: {{ item.payload.rs ?? '-' }}V / ST: {{ item.payload.st ?? '-' }}V / TR: {{ item.payload.rt ?? '-' }}V
                </template>
              </div>
              <AtomsButton
                variant="secondary"
                class="mt-2"
                @click="handleResolve(item, 'overwrite')"
              >
                自分の値で上書きする
              </AtomsButton>
            </div>
          </div>
        </div>
      </template>

      <!-- 同期実行・結果ビュー -->
      <template v-else>
        <div class="flex flex-col gap-3">
          <p class="m-0 summary-desc">
            地下受変電室等で記録された <strong>{{ pendingCount }}件</strong> の未送信データがあります。<br>
            現場で実際に測定された正確な時刻（実打鍵タイムスタンプ）とともにサーバーへ反映します。
          </p>

          <ul v-if="queue.length > 0" class="overflow-y-auto flex flex-col gap-1 max-h-[180px] m-0 p-2 list-none queue-list">
            <li
              v-for="item in queue.slice(0, 5)"
              :key="item.id"
              class="flex items-center gap-2 px-2 py-1 queue-item"
            >
              <AtomsBadge color="var(--color-category-tool)">
                P{{ item.phase }}
              </AtomsBadge>
              <span class="item-ban">{{ item.banMeisho }}</span>
              <span class="flex-1 item-kairo">{{ item.kairoBangou }} {{ item.kairoMeisho }}</span>
              <span class="item-time">{{ formatDateTime(item.clientConfirmedAt) }}</span>
            </li>
            <li v-if="queue.length > 5" class="p-1 text-center queue-more">
              ... 他 {{ queue.length - 5 }} 件
            </li>
          </ul>

          <MoleculesEmptyState
            v-else
            icon="check-circle"
            title="未送信データはありません"
            description="すべてのデータがサーバーと正常に同期されています。"
          />

          <!-- 同期結果ボックス (MoleculesResultBox) -->
          <MoleculesResultBox
            v-if="syncResult"
            :status="syncResult.errorCount > 0 ? 'danger' : 'success'"
            :title="syncResult.errorCount > 0 ? '同期エラー' : '同期完了'"
          >
            <template #value>
              <div v-if="syncResult.successCount > 0" class="flex items-center gap-1.5 result-success">
                <AtomsIcon name="check-circle" size="sm" />
                <span>{{ syncResult.successCount }} 件のデータを正常に同期しました。</span>
              </div>
              <div v-if="syncResult.errorCount > 0" class="flex items-center gap-1.5 result-danger">
                <AtomsIcon name="alert-circle" size="sm" />
                <span>{{ syncResult.errorCount }} 件の送信に失敗しました（電波状況を確認してください）。</span>
              </div>
            </template>
          </MoleculesResultBox>
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 modal-actions">
          <AtomsButton
            variant="secondary"
            @click="closeModal"
          >
            閉じる
          </AtomsButton>
          <AtomsButton
            variant="success"
            :loading="isSyncing"
            :disabled="pendingCount === 0"
            @click="handleStartSync"
          >
            <AtomsIcon name="upload" />
            サーバーへ送信実行
          </AtomsButton>
        </div>
      </template>
    </div>
  </OrganismsModal>
</template>

<style scoped lang="scss">
.modal-actions {
  border-top: 1px solid var(--color-border);
}

.summary-desc {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  color: var(--color-text-muted);
}

.queue-list {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
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

.queue-more {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.conflict-alert {
  border: 1px solid color-mix(in srgb, var(--color-status-warning) 30%, transparent);
  border-radius: var(--radius-sm);

  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  color: var(--color-status-warning);

  background: color-mix(in srgb, var(--color-status-warning) 10%, transparent);
}

.conflict-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--surface-bg-elevated);

  .card-header {
    border-bottom: 1px solid var(--color-border);
  }

  .card-ban {
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }

  .card-kairo {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
}

.conflict-col {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
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
    border-radius: var(--radius-sm);

    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    line-height: var(--line-height-ui);
    color: var(--color-text-muted);

    background: var(--surface-bg-elevated);
  }
}

.result-success {
  color: var(--color-status-success);
}

.result-danger {
  color: var(--color-status-danger);
}
</style>
