<script setup lang="ts">
/**
 * ResultDetails
 * [Tool Molecule] 計算結果に付随する内訳・補足情報を表示する最小コンポーネント。
 */
import type { ResultDetailItem } from '~/types/components'

defineProps<{
  items?: ResultDetailItem[]
}>()
</script>

<template>
  <dl v-if="items?.length || $slots.default" class="result-details flex flex-col gap-inline-gap w-full m-0 p-0">
    <div
      v-for="(item, i) in items"
      :key="i"
      class="flex items-center justify-between"
    >
      <dt class="m-0">
        {{ item.label }}
      </dt>
      <dd class="m-0 flex items-center gap-inline-gap">
        <span class="value">{{ item.value }}</span>
        <span v-if="item.unit">{{ item.unit }}</span>
        <span v-if="item.note">{{ item.note }}</span>
      </dd>
    </div>
    <slot />
  </dl>
</template>

<style scoped lang="scss">
.result-details {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-ui);
  color: var(--color-text-muted);

  dt {
    font-weight: var(--font-weight-normal);
  }

  .value {
    font-variant-numeric: tabular-nums;
    color: var(--color-text-main);
  }
}
</style>
