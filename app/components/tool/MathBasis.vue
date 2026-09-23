<script setup lang="ts">
/**
 * MathBasis
 * [Tool Organism] 計算ツールの計算根拠（数式ステップと凡例）を表示する純粋なプレゼンテーションコンポーネント。
 */
import 'katex/dist/katex.min.css'

import type { MathStep } from '~/types/tools'
import { renderMath } from '~/utils/math'

defineProps<{
  steps?: MathStep[] | null
}>()
</script>

<template>
  <div v-if="steps?.length" class="flex flex-col gap-panel-gap">
    <Panel
      v-for="(step, index) in steps"
      :key="index"
      class="flex flex-col gap-3"
    >
      <SectionHeader v-if="step.title" :title="step.title" tag="h4" />
      <div class="grid grid-cols-[1fr_auto] items-center gap-panel-gap">

        <div
          class="math-expr min-w-0 overflow-x-auto py-1"
          v-html="renderMath(step.tex, true)"
        />

        <ToolMathLegend :items="step.legend" />
      </div>
    </Panel>
  </div>
</template>

<style scoped lang="scss">
.math-expr {
  :deep(.katex-display) {
    margin: 0;
  }

  :deep(.katex) {
    font-size: var(--font-size-sm);
    color: var(--color-text-main);

    .tex-status-success {
      color: var(--color-status-success);
    }

    .tex-status-danger {
      color: var(--color-status-danger);
    }

    .tex-color-accent {
      color: var(--color-accent-main);
    }
  }
}
</style>
