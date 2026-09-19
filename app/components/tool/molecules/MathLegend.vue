<script setup lang="ts">
/**
 * ToolMathLegend
 * [Tool Molecule] 数式ステップの凡例（記号と説明の一覧）を表示するコンポーネント。
 */
import { computed } from 'vue'

import { parseLegend } from '~/utils/math'

const props = withDefaults(
  defineProps<{
    items?: string[] | null
    title?: string
  }>(),
  {
    title: '【凡例】',
  },
)

const parsedItems = computed(() => parseLegend(props.items ?? undefined))
</script>

<template>
  <div
    v-if="parsedItems.length > 0"
    class="math-legend flex flex-col gap-1 w-64 pl-3"
  >
    <span v-if="title" class="title">{{ title }}</span>
    <dl class="grid grid-cols-[max-content_1fr] gap-x-2 gap-y-0.5 items-baseline">
      <template v-for="(v, i) in parsedItems" :key="i">
        <dt class="whitespace-nowrap" v-html="v.renderedSymbol" />
        <dd class="min-w-0 break-words">{{ v.name }}</dd>
      </template>
    </dl>
  </div>
</template>

<style scoped lang="scss">
.math-legend {
  border-left: 1px solid var(--color-border);
  font-size: var(--font-size-2xs);
  color: var(--color-text-muted);

  .title {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-secondary);
  }

  dt :deep(.katex) {
    color: var(--color-text-muted);
  }
}
</style>
