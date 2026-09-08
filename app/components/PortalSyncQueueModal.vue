<script setup lang="ts">
/**
 * PortalSyncQueueModal
 * オフライン同期待ちキューの確認・手動同期実行・競合解決を行うOrganismモーダルコンポーネント。
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
  <AppModal
    :is-open="isOpen"
    title="現場データのサーバー同期"
    @close="closeModal"
  >
    <div class="sync-modal">
      <!-- 競合解決ビュー -->
      <template v-if="conflictItems.length > 0">
        <div class="sync-conflict-alert">
          ⚠️ <strong>{{ conflictItems.length }}件</strong> の回路で別の作業者との更新競合が発生しました。<br>
          内容を確認し、どちらの値を採用するか選択してください。
        </div>

        <div
          v-for="item in conflictItems"
          :key="item.id"
          class="sync-conflict-card"
        >
          <div class="sync-conflict-card__header">
            <span class="sync-conflict-card__ban">{{ item.banMeisho }}</span>
            <span class="sync-conflict-card__kairo">{{ item.kairoBangou }} {{ item.kairoMeisho }}</span>
            <AtomsBadge color="var(--color-status-warning)">
              フェーズ{{ item.phase }}
            </AtomsBadge>
          </div>

          <div class="sync-conflict-card__grid">
            <!-- サーバー側の値 -->
            <div class="sync-conflict-col is-server">
              <div class="sync-conflict-col__title">
                🌐 サーバー側の最新データ
              </div>
              <div class="sync-conflict-col__meta">
                更新日時: {{ formatDateTime(String(item.serverCircuitData?.updatedAt || '')) }}
              </div>
              <div class="sync-conflict-col__details">
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
                size="sm"
                class="mt-sm"
                @click="handleResolve(item, 'discard')"
              >
                サーバーの値を残す
              </AtomsButton>
            </div>

            <!-- 端末側（オフライン入力）の値 -->
            <div class="sync-conflict-col is-client">
              <div class="sync-conflict-col__title">
                📱 あなたのオフライン入力
              </div>
              <div class="sync-conflict-col__meta">
                実測定時刻: {{ formatDateTime(item.clientConfirmedAt) }}
              </div>
              <div class="sync-conflict-col__details">
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
                variant="primary"
                size="sm"
                class="mt-sm"
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
        <div class="sync-summary">
          <p class="sync-summary__desc">
            地下受変電室等で記録された <strong>{{ pendingCount }}件</strong> の未送信データがあります。<br>
            現場で実際に測定された正確な時刻（実打鍵タイムスタンプ）とともにサーバーへ反映します。
          </p>

          <ul v-if="queue.length > 0" class="sync-queue-list">
            <li
              v-for="item in queue.slice(0, 5)"
              :key="item.id"
              class="sync-queue-item"
            >
              <AtomsBadge color="var(--color-category-tool)">
                P{{ item.phase }}
              </AtomsBadge>
              <span class="sync-queue-item__ban">{{ item.banMeisho }}</span>
              <span class="sync-queue-item__kairo">{{ item.kairoBangou }} {{ item.kairoMeisho }}</span>
              <span class="sync-queue-item__time">{{ formatDateTime(item.clientConfirmedAt) }}</span>
            </li>
            <li v-if="queue.length > 5" class="sync-queue-more">
              ... 他 {{ queue.length - 5 }} 件
            </li>
          </ul>

          <MoleculesEmptyState
            v-else
            icon="check-circle"
            title="未送信データはありません"
            description="すべてのデータがサーバーと正常に同期されています。"
          />

          <!-- 同期結果ボックス (AppResultBox) -->
          <AppResultBox
            v-if="syncResult"
            :status="syncResult.errorCount > 0 ? 'danger' : 'success'"
            :title="syncResult.errorCount > 0 ? '同期エラー' : '同期完了'"
          >
            <template #value>
              <div v-if="syncResult.successCount > 0" class="u-text-success">
                ✅ {{ syncResult.successCount }} 件のデータを正常に同期しました。
              </div>
              <div v-if="syncResult.errorCount > 0" class="u-text-danger">
                ❌ {{ syncResult.errorCount }} 件の送信に失敗しました（電波状況を確認してください）。
              </div>
            </template>
          </AppResultBox>
        </div>

        <div class="sync-modal__actions">
          <AtomsButton
            variant="secondary"
            @click="closeModal"
          >
            閉じる
          </AtomsButton>
          <AtomsButton
            variant="primary"
            :loading="isSyncing"
            :disabled="pendingCount === 0"
            @click="handleStartSync"
          >
            サーバーへ送信実行 📤
          </AtomsButton>
        </div>
      </template>
    </div>
  </AppModal>
</template>

<style scoped lang="scss">
.sync-modal {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  &__actions {
    display: flex;
    gap: var(--space-3);
    justify-content: flex-end;

    padding-top: var(--space-3);
    border-top: 1px solid var(--color-border);
  }
}

.sync-summary {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  &__desc {
    margin: 0;
    font-size: var(--font-size-sm);
    line-height: var(--leading-relaxed);
    color: var(--color-text-muted);
  }
}

.sync-queue-list {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);

  max-height: 180px;
  margin: 0;
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);

  list-style: none;

  background: var(--surface-bg-subtle);
}

.sync-queue-item {
  display: flex;
  gap: var(--space-2);
  align-items: center;

  padding: var(--space-1) var(--space-2);

  font-size: var(--font-size-xs);

  &__ban {
    font-weight: var(--font-weight-bold);
    color: var(--color-text-base);
  }

  &__kairo {
    flex: 1;
    color: var(--color-text-muted);
  }

  &__time {
    font-family: var(--font-family-mono);
    color: var(--color-text-dim);
  }
}

.sync-queue-more {
  padding: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-text-dim);
  text-align: center;
}

.sync-conflict-alert {
  padding: var(--space-3);
  border: 1px solid color-mix(in srgb, var(--color-status-warning) 30%, transparent);
  border-radius: var(--radius-sm);

  font-size: var(--font-size-sm);
  line-height: var(--leading-relaxed);
  color: var(--color-status-warning);

  background: color-mix(in srgb, var(--color-status-warning) 10%, transparent);
}

.sync-conflict-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);

  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);

  background: var(--surface-bg-elevated);

  &__header {
    display: flex;
    gap: var(--space-2);
    align-items: center;

    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--color-border);
  }

  &__ban {
    font-weight: var(--font-weight-bold);
    color: var(--color-text-base);
  }

  &__kairo {
    flex: 1;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);

    @include mq("sm") {
      grid-template-columns: 1fr;
    }
  }
}

.sync-conflict-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);

  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);

  background: var(--surface-bg-subtle);

  &.is-server {
    border-color: color-mix(in srgb, var(--color-status-neutral) 30%, transparent);
  }

  &.is-client {
    border-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
    background: color-mix(in srgb, var(--color-primary) 5%, var(--surface-bg-subtle));
  }

  &__title {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-base);
  }

  &__meta {
    font-size: var(--font-size-2xs);
    color: var(--color-text-dim);
  }

  &__details {
    padding: var(--space-2);
    border-radius: var(--radius-xs);

    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    line-height: var(--leading-normal);
    color: var(--color-text-muted);

    background: var(--surface-bg-elevated);
  }
}

.mt-sm {
  margin-top: var(--space-2);
}
</style>
