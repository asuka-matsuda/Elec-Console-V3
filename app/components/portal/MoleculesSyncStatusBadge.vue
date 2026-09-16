<script setup lang="ts">
/**
 * PortalMoleculesSyncStatusBadge
 * [Molecules] オフライン同期状態（同期済／未同期件数）を表示し、クリックで同期モーダルを開くコンポーネント。
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
  <div class="inline-flex items-center">
    <!-- 未同期がある場合のボタン -->
    <template v-if="hasPending">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-2.5 py-1 sync-btn"
        :class="{ 'is-loading': isSyncing }"
        :disabled="isSyncing"
        @click="openModal"
      >
        <AtomsIcon
          v-if="isSyncing"
          name="refresh-cw"
          size="sm"
          class="animate-spin"
        />
        <AtomsIcon
          v-else
          name="zap"
          size="sm"
        />
        <span>未同期 {{ pendingCount }}件</span>
        <span class="inline-flex items-center gap-1 pl-1.5 action-divider">
          <span>同期実行</span>
          <AtomsIcon name="upload" size="sm" />
        </span>
      </button>
    </template>

    <!-- 通常時（同期完了状態） -->
    <template v-else>
      <div class="inline-flex items-center gap-1.5 px-2 py-1 sync-status">
        <span class="w-1.5 h-1.5 dot" />
        <span>同期済</span>
      </div>
    </template>

    <!-- 同期モーダル (Organism) -->
    <PortalOrganismsSyncQueueModal
      v-model="isModalOpen"
      :site-id="siteId"
      @synced="emit('synced')"
    />
  </div>
</template>

<style scoped lang="scss">
.sync-btn {
  border: 1px solid var(--color-status-warning);

  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-status-warning);

  background: color-mix(in srgb, var(--color-status-warning) 12%, var(--surface-bg-elevated));

  transition: var(--transition-interactive);

  @include state-control-interactive {
    cursor: pointer;

    &:hover {
      border-color: color-mix(in srgb, var(--color-status-warning) 80%, white);
      background: color-mix(in srgb, var(--color-status-warning) 20%, var(--surface-bg-elevated));
    }
  }

  .action-divider {
    border-left: 1px solid color-mix(in srgb, var(--color-status-warning) 30%, transparent);
  }

  @include state-loading;
  @include state-disabled;
}

.sync-status {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);

  .dot {
    border-radius: var(--radius-circle);
    background: var(--color-status-success);
  }
}
</style>
