<script setup lang="ts">
/**
 * SoudenBanCell
 * 送電試験テーブルの盤情報セル（盤名称・盤種別の2段組表示）。
 */
defineProps<{
  banMeisho: string
  banShubetsu?: string
}>()
</script>

<template>
  <div class="souden-ban-cell">
    <span class="souden-ban-cell__name" :title="banMeisho">{{ banMeisho }}</span>
    <span v-if="banShubetsu" class="souden-ban-cell__shubetsu">{{ banShubetsu }}</span>
  </div>
</template>

<style scoped lang="scss">
.souden-ban-cell {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 2px;

  &__name {
    overflow: hidden;

    font-size: var(--text-xs);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__shubetsu {
    font-size: 11px;
    color: var(--color-text-muted);
  }
}
</style>
