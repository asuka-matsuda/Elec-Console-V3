<script setup lang="ts">
/**
 * SoudenWorkerCell
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
  <div v-if="worker" class="flex flex-col items-center gap-0.5">
    <span class="cell-worker">{{ worker }}</span>
    <span class="cell-date">{{ formatShortDateTime(confirmedAt) }}</span>
  </div>
  <span v-else class="cell-dash">-</span>
</template>

<style scoped>
.cell-worker {
  color: var(--color-status-success);
}

.cell-date {
  font-family: var(--font-mono);
  font-size: var(--font-size-2xs);
}

.cell-date,
.cell-dash {
  color: var(--color-text-muted);
}
</style>
