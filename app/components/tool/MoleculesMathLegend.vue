<script setup lang="ts">
/**
 * MoleculesMathLegend
 * [Tool Molecule] 数式ステップの凡例（記号と説明の一覧）を表示するコンポーネント。
 * 文字列配列（"記号: 説明"）をパースし、KaTeXレンダリングされた記号と説明を2カラム定義リストで描画します。
 */
import { computed } from 'vue'

import { parseLegend } from '~/utils/math'

const props = withDefaults(
  defineProps<{
    items?: string[] | null
    title?: string
  }>(),
  {
    items: () => [],
    title: '【凡例】',
  },
)

const parsedItems = computed(() => parseLegend(props.items || []))
</script>

<template>
  <div
    v-if="parsedItems.length > 0"
    class="math-legend flex flex-col gap-1 min-w-0 sm:min-w-[200px] sm:max-w-[320px] pt-2 pl-0 sm:pt-0 sm:pl-3"
  >
    <h5 v-if="title" class="title">
      {{ title }}
    </h5>
    <dl class="grid grid-cols-[max-content_1fr] gap-x-2 gap-y-1 items-baseline">
      <template v-for="v in parsedItems" :key="v.name">
        <dt v-html="v.renderedSymbol" />
        <dd>{{ v.name }}</dd>
      </template>
    </dl>
  </div>
</template>

<style scoped lang="scss">
.math-legend {
  border-left: 1px solid var(--color-border);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-muted);

  @include mq("sm") {
    border-top: 1px solid var(--color-border);
    border-left: none;
  }

  .title {
    color: var(--color-text-secondary);
  }

  dt {
    white-space: nowrap;

    &::after {
      content: ":";
    }

    :deep(.katex) {
      color: var(--color-text-muted);
    }
  }

  dd {
    min-width: 0;
    font-size: var(--font-size-2xs);
    overflow-wrap: break-word;
  }
}
</style>
