<script setup lang="ts">
/**
 * ToolOrganismsMathBasis
 * [Tool Organism] 計算ツールの計算根拠（数式やステップ・凡例）を表示する純粋なプレゼンテーションコンポーネント。
 * KaTeX による数式レンダリングと凡例の2カラム表示を提供します。
 */
import 'katex/dist/katex.min.css'

import type { MathStep } from '~/types/tools'
import { renderMath } from '~/utils/math'

defineProps<{
  steps?: MathStep[] | null
}>()
</script>

<template>
  <div class="flex flex-col gap-panel-gap">
    <ClientOnly>
      <div v-if="steps && steps.length > 0" class="flex flex-col gap-panel-gap">
        <Panel
          v-for="(step, index) in steps"
          :key="index"
          class="flex flex-col gap-3"
        >
          <SectionHeader v-if="step.title" :title="step.title" tag="h4" />
          <div class="grid grid-cols-1 items-stretch sm:grid-cols-[1fr_auto] sm:items-center gap-panel-gap">
            <!-- 左側: 計算式 -->
            <div
              class="math-expr min-w-0 overflow-x-hidden overflow-y-hidden py-1"
              v-html="renderMath(step.tex, true)"
            />

            <!-- 右側: 凡例 -->
            <ToolMoleculesMathLegend :items="step.legend" />
          </div>
        </Panel>
      </div>
    </ClientOnly>

    <div v-if="$slots.default" class="flex flex-col gap-2">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.math-expr {
  overflow-x: hidden;
  outline: none;

  :deep(.katex-display) {
    margin: 0;
  }

  :deep(.katex) {
    color: var(--color-text-main);

    .tex-status-success,
    .tex-status-success * {
      color: var(--color-status-success);
    }

    .tex-status-warning,
    .tex-status-warning * {
      color: var(--color-status-warning);
    }

    .tex-status-danger,
    .tex-status-danger * {
      color: var(--color-status-danger);
    }

    .tex-color-accent,
    .tex-color-accent * {
      color: var(--color-accent-main);
    }
  }
}
</style>
