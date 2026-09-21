<script setup lang="ts">
/**
 * PortalSyncStatusBadge
 * [Portal Molecules] オフライン同期状態（未同期件数／同期済）を表示し、クリックで同期モーダルを開く。
 */
import { ref, toRef } from 'vue'

import { useOfflineSync } from '~/composables/portal/useOfflineSync'

const props = defineProps<{
  siteId: string
}>()

const emit = defineEmits<{
  (e: 'synced'): void
}>()

const {
  pendingCount,
  hasPending,
  isSyncing,
} = useOfflineSync(toRef(props, 'siteId'))

const isModalOpen = ref(false)
</script>

<template>
  <div class="inline-flex items-center">
    <!-- 未同期時：同期実行キューモーダルを開くボタン -->
    <button
      v-if="hasPending"
      type="button"
      class="inline-flex items-center gap-1.5 px-2.5 py-1 sync-btn"
      :disabled="isSyncing"
      @click="isModalOpen = true"
    >
      <Icon
        :name="isSyncing ? 'refresh-cw' : 'zap'"
        size="sm"
        :class="{ 'animate-spin': isSyncing }"
      />
      <span>未同期 {{ pendingCount }}件</span>
      <span class="inline-flex items-center gap-1 pl-1.5 sync-action">
        同期実行
        <Icon name="upload" size="sm" />
      </span>
    </button>

    <!-- 通常時：同期済ステータス表示 -->
    <div v-else class="inline-flex items-center gap-1.5 px-2 py-1 sync-status">
      <span class="sync-dot" />
      <span>同期済</span>
    </div>

    <!-- 同期モーダル：開いた時のみ遅延マウント -->
    <PortalOrganismsSyncQueueModal
      v-if="isModalOpen"
      v-model="isModalOpen"
      :site-id="siteId"
      @synced="emit('synced')"
    />
  </div>
</template>

<style scoped>
.sync-btn {
  cursor: pointer;

  border: 1px solid var(--color-status-warning);

  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-status-warning);

  background: color-mix(in srgb, var(--color-status-warning) 12%, var(--surface-bg-elevated));

  transition: var(--transition-interactive);
}

.sync-btn:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--color-status-warning) 80%, white);
  background: color-mix(in srgb, var(--color-status-warning) 20%, var(--surface-bg-elevated));
}

.sync-btn:disabled {
  pointer-events: none;
  cursor: not-allowed;
  opacity: 0.6;
}

.sync-action {
  border-left: 1px solid color-mix(in srgb, var(--color-status-warning) 30%, transparent);
}

.sync-status {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.sync-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: var(--radius-circle);
  background: var(--color-status-success);
}
</style>
