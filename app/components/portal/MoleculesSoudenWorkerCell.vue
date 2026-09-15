<script setup lang="ts">
/**
 * PortalMoleculesSoudenWorkerCell
 * [Portal Molecules] 送電試験テーブル用の測定者・確定日時表示セルコンポーネント。
 * 測定完了時は作業者名と日時を縦並びで表示し、未完了時はハイフンを表示します。
 */
import { formatShortDateTime } from '~/utils/date'

defineProps<{
  worker?: string | null
  confirmedAt?: string | null
}>()
</script>

<template>
  <div v-if="worker" class="worker-cell flex flex-col items-center gap-0.5">
    <strong class="worker-name">{{ worker }}</strong>
    <span class="worker-date">{{ formatShortDateTime(confirmedAt) }}</span>
  </div>
  <span v-else class="worker-dash">-</span>
</template>

<style scoped lang="scss">
.worker-cell {
  .worker-name {
    font-size: inherit;
    font-weight: var(--font-weight-normal);
    color: var(--color-status-success);
  }

  .worker-date {
    font-family: var(--font-mono);
    font-size: var(--font-size-2xs);
    color: var(--color-text-muted);
  }
}

.worker-dash {
  color: var(--color-text-muted);
}
</style>
