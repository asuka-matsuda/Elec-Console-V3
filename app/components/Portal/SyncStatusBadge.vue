<script setup lang="ts">
import { computed, ref, toRef } from 'vue'

import type { PendingSyncItem, SyncResult } from '~/composables/portal/useOfflineSync'
import { useOfflineSync } from '~/composables/portal/useOfflineSync'

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
  hasPending,
  isSyncing,
  syncAll,
  resolveConflict,
} = useOfflineSync(siteIdRef)

const isModalOpen = ref(false)
const syncResult = ref<SyncResult | null>(null)
const selectedConflictItem = ref<PendingSyncItem | null>(null)

const conflictItems = computed(() => queue.value.filter(item => item.status === 'conflict'))

const openModal = () => {
  isModalOpen.value = true
  syncResult.value = null
}

const closeModal = () => {
  if (isSyncing.value) return
  isModalOpen.value = false
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
  <div class="p-sync-badge">
    <!-- 未同期がある場合のボタン -->
    <template v-if="hasPending">
      <button
        type="button"
        class="p-sync-btn is-pending"
        :class="{ 'is-loading': isSyncing }"
        :disabled="isSyncing"
        @click="openModal"
      >
        <span class="p-sync-btn__icon">⚡</span>
        <span class="p-sync-btn__text">未同期 {{ pendingCount }}件</span>
        <span class="p-sync-btn__action">同期実行 📤</span>
      </button>
    </template>

    <!-- 通常時（同期完了状態） -->
    <template v-else>
      <div class="p-sync-status is-synced">
        <span class="p-sync-status__dot" />
        <span class="p-sync-status__text">同期済</span>
      </div>
    </template>

    <!-- 手動同期・競合確認モーダル -->
    <AppModal
      :is-open="isModalOpen"
      title="現場データのサーバー同期"
      @close="closeModal"
    >
      <div class="p-sync-modal">
        <!-- 競合解決ビュー -->
        <template v-if="conflictItems.length > 0">
          <div class="p-sync-conflict-alert">
            ⚠️ <strong>{{ conflictItems.length }}件</strong> の回路で別の作業者との更新競合が発生しました。<br>
            内容を確認し、どちらの値を採用するか選択してください。
          </div>

          <div
            v-for="item in conflictItems"
            :key="item.id"
            class="p-sync-conflict-card"
          >
            <div class="p-sync-conflict-card__header">
              <span class="p-sync-conflict-card__ban">{{ item.banMeisho }}</span>
              <span class="p-sync-conflict-card__kairo">{{ item.kairoBangou }} {{ item.kairoMeisho }}</span>
              <AppBadge color="var(--color-status-warning)">
                フェーズ{{ item.phase }}
              </AppBadge>
            </div>

            <div class="p-sync-conflict-card__grid">
              <!-- サーバー側の値 -->
              <div class="p-sync-conflict-col is-server">
                <div class="p-sync-conflict-col__title">
                  🌐 サーバー側の最新データ
                </div>
                <div class="p-sync-conflict-col__meta">
                  更新日時: {{ formatDateTime(String(item.serverCircuitData?.updatedAt || '')) }}
                </div>
                <div class="p-sync-conflict-col__details">
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
                <AppButton
                  variant="secondary"
                  size="sm"
                  class="u-mt-sm"
                  @click="handleResolve(item, 'discard')"
                >
                  サーバーの値を残す
                </AppButton>
              </div>

              <!-- 端末側（オフライン入力）の値 -->
              <div class="p-sync-conflict-col is-client">
                <div class="p-sync-conflict-col__title">
                  📱 あなたのオフライン入力
                </div>
                <div class="p-sync-conflict-col__meta">
                  実測定時刻: {{ formatDateTime(item.clientConfirmedAt) }}
                </div>
                <div class="p-sync-conflict-col__details">
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
                <AppButton
                  variant="primary"
                  size="sm"
                  class="u-mt-sm"
                  @click="handleResolve(item, 'overwrite')"
                >
                  自分の値で上書きする
                </AppButton>
              </div>
            </div>
          </div>
        </template>

        <!-- 同期実行・結果ビュー -->
        <template v-else>
          <div class="p-sync-summary">
            <p class="p-sync-summary__desc">
              地下受変電室等で記録された <strong>{{ pendingCount }}件</strong> の未送信データがあります。<br>
              現場で実際に測定された正確な時刻（実打鍵タイムスタンプ）とともにサーバーへ反映します。
            </p>

            <ul class="p-sync-queue-list">
              <li
                v-for="item in queue.slice(0, 5)"
                :key="item.id"
                class="p-sync-queue-item"
              >
                <span class="p-sync-queue-item__badge">P{{ item.phase }}</span>
                <span class="p-sync-queue-item__ban">{{ item.banMeisho }}</span>
                <span class="p-sync-queue-item__kairo">{{ item.kairoBangou }} {{ item.kairoMeisho }}</span>
                <span class="p-sync-queue-item__time">{{ formatDateTime(item.clientConfirmedAt) }}</span>
              </li>
              <li v-if="queue.length > 5" class="p-sync-queue-more">
                ... 他 {{ queue.length - 5 }} 件
              </li>
            </ul>

            <div v-if="syncResult" class="p-sync-result-box">
              <div v-if="syncResult.successCount > 0" class="c-text-success">
                ✅ {{ syncResult.successCount }} 件のデータを正常に同期しました。
              </div>
              <div v-if="syncResult.errorCount > 0" class="c-text-danger">
                ❌ {{ syncResult.errorCount }} 件の送信に失敗しました（電波状況を確認してください）。
              </div>
            </div>
          </div>

          <div class="p-sync-modal__actions">
            <AppButton
              variant="secondary"
              @click="closeModal"
            >
              閉じる
            </AppButton>
            <AppButton
              variant="primary"
              :loading="isSyncing"
              :disabled="pendingCount === 0"
              @click="handleStartSync"
            >
              サーバーへ送信実行 📤
            </AppButton>
          </div>
        </template>
      </div>
    </AppModal>
  </div>
</template>

<style scoped lang="scss">
.p-sync-badge {
  display: inline-flex;
  align-items: center;
}

.p-sync-btn {
  cursor: pointer;

  display: inline-flex;
  gap: var(--space-2);
  align-items: center;

  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-status-warning);
  border-radius: var(--radius-base);

  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-status-warning);

  background: color-mix(in srgb, var(--color-status-warning) 12%, var(--surface-bg-elevated));
  box-shadow: 0 0 10px color-mix(in srgb, var(--color-status-warning) 25%, transparent);

  transition: var(--transition-base);

  &:hover:not(:disabled) {
    background: color-mix(in srgb, var(--color-status-warning) 22%, var(--surface-bg-elevated));
    box-shadow: 0 0 14px color-mix(in srgb, var(--color-status-warning) 40%, transparent);
  }

  &__icon {
    animation: pulse-glow 1.5s infinite alternate;
  }

  &__action {
    padding-left: var(--space-2);
    border-left: 1px solid color-mix(in srgb, var(--color-status-warning) 35%, transparent);
  }
}

.p-sync-status {
  display: inline-flex;
  gap: var(--space-1);
  align-items: center;

  padding: var(--space-1) var(--space-2);

  font-size: var(--font-size-xs);
  color: var(--color-text-dim);

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;

    background: var(--color-status-success);
    box-shadow: 0 0 6px var(--color-status-success);
  }
}

.p-sync-modal {
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

.p-sync-summary {
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

.p-sync-queue-list {
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

.p-sync-queue-item {
  display: flex;
  gap: var(--space-2);
  align-items: center;

  padding: var(--space-1) var(--space-2);

  font-size: var(--font-size-xs);

  &__badge {
    padding: 1px 4px;
    border-radius: var(--radius-xs);

    font-weight: var(--font-weight-bold);
    color: var(--color-primary-light);

    background: color-mix(in srgb, var(--color-primary) 20%, transparent);
  }

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

.p-sync-queue-more {
  padding: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-text-dim);
  text-align: center;
}

.p-sync-result-box {
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  background: var(--surface-bg-elevated);
}

.p-sync-conflict-alert {
  padding: var(--space-3);
  border: 1px solid var(--color-status-warning);
  border-radius: var(--radius-sm);

  font-size: var(--font-size-sm);
  line-height: var(--leading-normal);
  color: var(--color-status-warning);

  background: color-mix(in srgb, var(--color-status-warning) 10%, var(--surface-bg-elevated));
}

.p-sync-conflict-card {
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
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
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
    margin-top: var(--space-3);
  }
}

.p-sync-conflict-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);

  padding: var(--space-3);
  border-radius: var(--radius-sm);

  background: var(--surface-bg-subtle);

  &.is-server {
    border-left: 3px solid var(--color-border);
  }

  &.is-client {
    border-left: 3px solid var(--color-primary);
  }

  &__title {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-base);
  }

  &__meta {
    font-size: 11px;
    color: var(--color-text-dim);
  }

  &__details {
    padding: var(--space-2) 0;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
    color: var(--color-text-base);
  }
}

@keyframes pulse-glow {
  0% {
    transform: scale(0.95);
    opacity: 0.8;
  }

  100% {
    transform: scale(1.1);
    opacity: 1;
  }
}
</style>
