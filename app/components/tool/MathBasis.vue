<script setup lang="ts">
/**
 * MathBasis
 * [Tool Organism] 計算ツールの計算根拠（数式ステップと凡例）を表示する純粋なプレゼンテーションコンポーネント。
 */
import 'katex/dist/katex.min.css'

import type { MathStep } from '~/types/tools'
import { parseLegend, renderMath } from '~/utils/math'

defineProps<{
  steps?: MathStep[] | null
}>()
</script>

<template>
  <div v-if="steps?.length" class="flex flex-col gap-panel-gap">
    <div v-for="(step, index) in steps" :key="index" class="panel flex flex-col gap-inline-gap">
      <h4 v-if="step.title">
        {{ step.title }}
      </h4>

      <div class="math-expr min-w-0 overflow-x-auto py-inline-gap" v-html="renderMath(step.tex, true)" />

      <div v-if="step.legend && parseLegend(step.legend).length > 0" class="math-legend flex flex-col gap-inline-gap pt-inline-gap">
        <span class="legend-title">【凡例】</span>
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-panel-gap gap-y-inline-gap">
          <div v-for="(v, i) in parseLegend(step.legend)" :key="i" class="flex items-baseline gap-item-gap min-w-0">
            <dt class="whitespace-nowrap shrink-0" v-html="v.renderedSymbol" />
            <dd class="min-w-0 break-words">{{ v.name }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.math-expr {
  font-size: var(--font-size-sm);
  color: var(--color-text-main);
}

.math-legend {
  border-top: 1px dashed var(--color-border);
  font-size: var(--font-size-2xs);

  .legend-title {
    font-weight: var(--font-weight-bold);
    color: var(--color-text-secondary);
  }

  dt {
    color: var(--color-text-secondary);
  }

  dd {
    color: var(--color-text-muted);
  }
}
</style>
