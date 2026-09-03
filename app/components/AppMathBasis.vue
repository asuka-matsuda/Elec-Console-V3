<script setup lang="ts">
/**
 * AppMathBasis
 * KaTeXを利用して、数式とその凡例（変数の説明）をステップごとに表示するコンポーネント。
 */
import 'katex/dist/katex.min.css' // Required for rendering KaTeX styles

import katex from 'katex'

export type MathStep = {
  title?: string
  tex: string
  legend?: string[]
}

defineProps<{
  steps: MathStep[]
}>()

/**
 * 各ステップの legend (string[]) をパースして使いやすいオブジェクト配列に変換する
 */
const parseLegend = (legendArray: string[] | undefined) => {
  if (!legendArray) return []

  return legendArray.map((leg) => {
    const parts = leg.split(':')
    let rawSymbol = parts[0]?.trim() || ''

    // KaTeXの renderToString は純粋な数式を期待するため、数式マーカーを剥がす
    rawSymbol = rawSymbol.replace(/\\\(/g, '').replace(/\\\)/g, '').trim()
    const name = parts.slice(1).join(':')?.trim() || leg

    return { symbol: rawSymbol, name }
  })
}

/**
 * Helper to safely render KaTeX string
 */
const renderMath = (mathStr: string, isDisplay: boolean = true) => {
  if (!mathStr) return ''
  try {
    return katex.renderToString(mathStr, {
      displayMode: isDisplay,
      throwOnError: false,
      trust: true,
      strict: false,
    })
  }
  catch (e) {
    console.error('KaTeX render error:', e)

    return mathStr
  }
}
</script>

<template>
  <!-- eslint-disable vue/no-v-html -->
  <div class="c-math-basis">
    <template v-if="steps && steps.length > 0">
      <AppCard
        v-for="(step, index) in steps"
        :key="index"
        class="c-math-basis__card"
      >
        <AppSectionHeader
          v-if="step.title"
          :title="step.title"
          tag="h4"
          variant="tool"
          size="sm"
        />

        <div class="c-math-basis__body">
          <!-- 左カラム：公式 -->

          <div class="c-math-basis__math" v-html="renderMath(step.tex)"></div>

          <!-- 右カラム：凡例 -->
          <div
            v-if="step.legend && step.legend.length"
            class="c-math-basis__legend"
          >
            <h5 class="c-math-basis__legend-title">【凡例】</h5>
            <ul class="c-math-basis__legend-list">
              <li
                v-for="v in parseLegend(step.legend)"
                :key="v.symbol"
                class="c-math-basis__legend-item"
              >
                <span
                  class="c-math-basis__legend-symbol"
                  v-html="renderMath(v.symbol, false)"
                ></span>
                <span class="c-math-basis__legend-sep">:</span>
                <span class="c-math-basis__legend-name">{{ v.name }}</span>
              </li>
            </ul>
          </div>
        </div>
      </AppCard>
    </template>
  </div>
</template>

<style scoped lang="scss">
.c-math-basis {
  @include flex-start-stretch($direction: column);

  overflow-y: auto;
  flex: 1;
  gap: var(--space-card-gap);

  padding-right: var(--space-2);
  padding-bottom: var(--space-layout-pad);

  &__card {
    gap: var(--space-3);
  }

  &__body {
    /* PCファースト: カード内を左右2カラムに分割 */
    @include flex-start-center;

    gap: var(--space-card-gap);
    align-items: flex-start;
  }

  &__math {
    --scrollbar-size: var(--space-2);

    // スクロールバー自体は非表示にしつつスクロールは可能にする
    scrollbar-width: none;
    overflow-x: auto;
    flex: 1;
    min-width: 0;

    &::-webkit-scrollbar {
      display: none;
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

    :deep(.katex-display) {
      padding: var(--space-1);
    }
  }

  &__legend {
    @include flex-start-stretch($direction: column);

    flex-shrink: 0;
    gap: var(--space-1);
    width: 250px;
  }

  &__legend-title {
    @include text-meta("md", "bold");

    color: var(--color-text-muted);
  }

  &__legend-list {
    @include flex-start-stretch($direction: column);

    gap: var(--space-1);
  }

  &__legend-item {
    @include text-body("md", "bold");
    @include flex-start-center;

    gap: var(--space-1);
    align-items: flex-start;
    color: var(--color-text-secondary);
  }

  &__legend-symbol {
    color: var(--color-text-main);
  }

  &__legend-sep {
    color: var(--color-text-muted);
  }

  &__legend-name {
    flex: 1;
  }
}
</style>
