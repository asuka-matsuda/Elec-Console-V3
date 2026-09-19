<script setup lang="ts">
/**
 * ToolResultDetails
 * [Tool Molecule] 計算結果に付随する内訳・補足情報を表示する最小コンポーネント。
 */
import type { ResultDetailItem } from '~/types/components'

defineProps<{
  items?: ResultDetailItem[]
}>()
</script>

<template>
  <div v-if="items?.length || $slots.default" class="result-details flex flex-col gap-1 w-full">
    <div
      v-for="(item, i) in items"
      :key="i"
      class="flex items-center justify-between"
    >
      <span>{{ item.label }}</span>
      <div class="flex items-center gap-1">
        <span class="value">{{ item.value }}</span>
        <span v-if="item.unit">{{ item.unit }}</span>
        <span v-if="item.note">{{ item.note }}</span>
      </div>
    </div>
    <slot />
  </div>
</template>

<style scoped lang="scss">
.result-details {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-ui);
  color: var(--color-text-muted);

  .value {
    font-variant-numeric: tabular-nums;
    color: var(--color-text-main);
  }
}
</style>
