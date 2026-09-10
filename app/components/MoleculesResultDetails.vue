<script setup lang="ts">
/**
 * MoleculesResultDetails
 * [Molecules] 計算結果やスペックの詳細内訳をラベルと値の対照形式で表示するコンポーネント。
 */
import type { ResultDetailItem } from '~/types/components'

export type { ResultDetailItem }

defineProps<{
  items?: ResultDetailItem[]
}>()
</script>

<template>
  <div class="result-details flex flex-col gap-1 w-full mt-1">
    <!-- リスト形式の内訳（アイテムがある場合） -->
    <dl v-if="items && items.length > 0" class="m-0 p-0 flex flex-col gap-1">
      <div
        v-for="item in items"
        :key="item.label"
        class="flex items-center justify-between"
      >
        <dt class="label">{{ item.label }}</dt>
        <dd class="m-0 flex items-center gap-1">
          <span class="value">{{ item.value }}</span>
          <span v-if="item.unit" class="unit">{{ item.unit }}</span>
          <span v-if="item.note" class="note">{{ item.note }}</span>
        </dd>
      </div>
    </dl>

    <!-- 自由なテキスト（内線規程など）を受け取るスロット -->
    <slot />
  </div>
</template>

<style scoped lang="scss">
.result-details {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-normal);
  color: var(--color-text-muted);

  .label,
  .unit,
  .note {
    color: var(--color-text-muted);
  }

  .value {
    font-variant-numeric: tabular-nums;
    color: var(--color-text-main);
  }
}
</style>
