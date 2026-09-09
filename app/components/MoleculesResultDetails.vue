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
  <dl class="flex flex-col gap-[var(--space-1)] pt-[var(--space-3)] border-t border-[var(--color-border)]">
    <template v-if="items">
      <div
        v-for="item in items"
        :key="item.label"
        class="flex items-center justify-between"
        :class="{ 'pt-[var(--space-1)] border-t border-[var(--color-border)]': item.topBorder }"
      >
        <dt>{{ item.label }}</dt>
        <dd>
          <strong>{{ item.value }}</strong>
          <span v-if="item.unit"> {{ item.unit }}</span>
          <small v-if="item.note"> {{ item.note }}</small>
        </dd>
      </div>
    </template>

    <slot />
  </dl>
</template>

<style scoped lang="scss">
dl {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

strong {
  font-weight: var(--font-weight-bold);
  color: var(--color-text-main);
}

small {
  font-size: var(--font-size-2xs);
  color: var(--color-text-muted);
}
</style>
