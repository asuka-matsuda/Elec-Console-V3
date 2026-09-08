<script setup lang="ts">
/**
 * SoudenWorkerCell
 * 送電試験テーブルの測定者・確定日時表示セル。
 */
import { formatShortDateTime } from '~/utils/date'

defineProps<{
  worker?: string | null
  confirmedAt?: string | null
}>()
</script>

<template>
  <div v-if="worker" class="souden-worker-cell">
    <strong class="souden-worker-cell__worker">{{ worker }}</strong>
    <span class="souden-worker-cell__date">{{ formatShortDateTime(confirmedAt) }}</span>
  </div>
  <span v-else class="souden-worker-cell__dash">-</span>
</template>

<style scoped lang="scss">
.souden-worker-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;

  &__worker {
    font-size: var(--text-xs);
    font-weight: var(--font-weight-bold);
    color: var(--color-status-success);
  }

  &__date {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-muted);
  }

  &__dash {
    color: var(--color-text-muted);
  }
}
</style>
