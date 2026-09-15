<script setup lang="ts">
/**
 * PortalSyncStatusBadge
 * オフライン同期状態（同期済／未同期件数）を表示し、クリックで同期モーダルを開くMoleculeコンポーネント。
 */
import { ref, toRef } from 'vue'

import { useOfflineSync } from '~/composables/portal/useOfflineSync'

const props = defineProps<{
  siteId: string
}>()

const emit = defineEmits<{
  (e: 'synced'): void
}>()

const siteIdRef = toRef(props, 'siteId')
const {
  pendingCount,
  hasPending,
  isSyncing,
} = useOfflineSync(siteIdRef)

const isModalOpen = ref(false)

const openModal = () => {
  isModalOpen.value = true
}
</script>

<template>
  <div class="inline-flex items-center portal-sync-status-badge">
    <!-- 未同期がある場合のボタン -->
    <template v-if="hasPending">
      <button
        type="button"
        class="inline-flex items-center gap-2 sync-btn is-pending"
        :class="{ 'is-loading': isSyncing }"
        :disabled="isSyncing"
        @click="openModal"
      >
        <span class="sync-btn__icon">⚡</span>
        <span class="sync-btn__text">未同期 {{ pendingCount }}件</span>
        <span class="sync-btn__action">同期実行 📤</span>
      </button>
    </template>

    <!-- 通常時（同期完了状態） -->
    <template v-else>
      <div class="inline-flex items-center gap-1 sync-status is-synced">
        <span class="sync-status__dot" />
        <span class="sync-status__text">同期済</span>
      </div>
    </template>

    <!-- 同期モーダル (Organism) -->
    <PortalSyncQueueModal
      v-model="isModalOpen"
      :site-id="siteId"
      @synced="emit('synced')"
    />
  </div>
</template>

<style scoped lang="scss">
.portal-sync-status-badge {
  // Scoped layout removed
}

.sync-btn {
  --glow-color: var(--color-status-warning);

  cursor: pointer;

  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-status-warning);
  border-radius: var(--radius-sm);

  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-status-warning);

  background: color-mix(in srgb, var(--color-status-warning) 12%, var(--surface-bg-elevated));
  box-shadow: var(--shadow-glow-sm);

  transition: var(--transition-interactive);

  &:hover:not(:disabled) {
    background: color-mix(in srgb, var(--color-status-warning) 22%, var(--surface-bg-elevated));
    box-shadow: var(--shadow-glow-hover);
  }

  &__icon {
    animation: pulse-glow 1.5s infinite alternate;
  }

  &__action {
    padding-left: var(--space-2);
    border-left: 1px solid color-mix(in srgb, var(--color-status-warning) 35%, transparent);
  }
}

.sync-status {
  padding: var(--space-1) var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);

  &__dot {
    --glow-color: var(--color-status-success);

    width: 6px;
    height: 6px;
    border-radius: 50%;

    background: var(--color-status-success);
    box-shadow: var(--shadow-glow-sm);
  }
}

@keyframes pulse-glow {
  from {
    transform: scale(0.95);
    opacity: 0.7;
  }

  to {
    transform: scale(1.05);
    opacity: 1;
  }
}
</style>
