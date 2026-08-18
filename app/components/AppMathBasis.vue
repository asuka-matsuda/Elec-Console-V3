<script setup lang="ts">
import katex from "katex";
import "katex/dist/katex.min.css"; // Required for rendering KaTeX styles

export type MathStep = {
  title?: string;
  tex: string;
  legend?: string[];
};

defineProps<{
  steps: MathStep[];
}>();

// 各ステップの legend (string[]) をパースして使いやすいオブジェクト配列に変換する
const parseLegend = (legendArray: string[] | undefined) => {
  if (!legendArray) return [];
  return legendArray.map((leg) => {
    const parts = leg.split(":");
    let rawSymbol = parts[0]?.trim() || "";
    // KaTeXの renderToString は純粋な数式を期待するため、数式マーカーを剥がす
    rawSymbol = rawSymbol.replace(/\\\(/g, "").replace(/\\\)/g, "").trim();
    const name = parts.slice(1).join(":")?.trim() || leg;
    return { symbol: rawSymbol, name };
  });
};

// Helper to safely render KaTeX string
const renderMath = (mathStr: string, isDisplay: boolean = true) => {
  if (!mathStr) return "";
  try {
    return katex.renderToString(mathStr, {
      displayMode: isDisplay,
      throwOnError: false,
    });
  } catch (e) {
    console.error("KaTeX render error:", e);
    return mathStr;
  }
};
</script>

<template>
  <div class="c-math-basis">
    <template v-if="steps && steps.length > 0">
      <AppCard
        v-for="(step, index) in steps"
        :key="index"
        class="c-math-basis__card"
      >
        <header v-if="step.title" class="c-math-basis__header">
          <h4 class="c-math-basis__title">{{ step.title }}</h4>
        </header>

        <AppDivider
          v-if="step.title"
          variant="tool"
          class="c-math-basis__divider"
        />

        <div class="c-math-basis__body">
          <!-- 左カラム：公式 -->
          <!-- eslint-disable-next-line vue/no-v-html -->
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
                <!-- eslint-disable-next-line vue/no-v-html -->
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
  display: flex;
  flex-direction: column;
  gap: var(--gap-section);
  flex: 1;
  overflow-y: auto;
  padding-right: var(--space-2);
  padding-bottom: var(--pad-container);

  &__card {
    gap: var(--gap-component);
  }

  &__title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    color: var(--color-category-tool);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__body {
    /* PCファースト: カード内を左右2カラムに分割 */
    display: flex;
    flex-flow: row nowrap;
    gap: var(--gap-section);
    align-items: flex-start;
  }

  &__math {
    flex: 1;
    min-width: 0;
    font-size: 1.1em;
    overflow-x: auto;

    --scrollbar-size: var(--size-2);

    :deep(.katex) {
      color: var(--color-text-main);
    }

    :deep(.katex-display) {
      padding: var(--space-1);
    }
  }

  &__legend {
    width: 250px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
  }

  &__legend-title {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-muted);
    margin-bottom: var(--space-1);
  }

  &__legend-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    list-style: none;
  }

  &__legend-item {
    display: flex;
    align-items: flex-start;
    gap: var(--space-1);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  &__legend-symbol {
    color: var(--color-text-main);
    font-weight: var(--font-weight-bold);
  }

  &__legend-sep {
    color: var(--color-text-muted);
  }

  &__legend-name {
    flex: 1;
  }
}
</style>
