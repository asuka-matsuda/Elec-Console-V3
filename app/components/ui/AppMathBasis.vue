<script setup lang="ts">
/**
 * AppMathBasis
 * KaTeXを利用して、数式とその凡例（変数の説明）をステップごとに表示するコンポーネント。
 */
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

/**
 * 各ステップの legend (string[]) をパースして使いやすいオブジェクト配列に変換する
 */
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

/**
 * Helper to safely render KaTeX string
 */
const renderMath = (mathStr: string, isDisplay: boolean = true) => {
  if (!mathStr) return "";
  try {
    return katex.renderToString(mathStr, {
      displayMode: isDisplay,
      throwOnError: false,
      trust: true,
      strict: false,
    });
  } catch (e) {
    console.error("KaTeX render error:", e);
    return mathStr;
  }
};
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
  // --- その他 ---
  overflow-y: auto;

  // --- レイアウト・配置 ---
  @include flex-column(var(--gap-section));

  flex: 1;

  // --- ボックスモデル ---
  padding-right: var(--pad-component);
  padding-bottom: var(--pad-container);

  // --- 子要素 ---
  &__card {
    // --- レイアウト・配置 ---
    gap: var(--gap-component);
  }

  &__body {
    /* PCファースト: カード内を左右2カラムに分割 */

    // --- レイアウト・配置 ---
    display: flex;
    flex-flow: row nowrap;
    gap: var(--gap-section);
    align-items: flex-start;
  }

  &__math {
    // --- CSSカスタムプロパティ ---
    --scrollbar-size: var(--size-2);

    // スクロールバー自体は非表示にしつつスクロールは可能にする
    scrollbar-width: none;

    // --- その他 ---
    overflow-x: auto;

    // --- レイアウト・配置 ---
    flex: 1;

    // --- ボックスモデル ---
    min-width: 0;

    // --- タイポグラフィ ---
    font-size: 1.1em;

    // --- 疑似要素 ---
    &::-webkit-scrollbar {
      // --- レイアウト・配置 ---
      display: none;
    }

    // --- 疑似クラス ---
    :deep(.katex) {
      // --- タイポグラフィ ---
      color: var(--color-text-main);

      .tex-status-success,
      .tex-status-success * {
        // --- タイポグラフィ ---
        color: var(--color-status-success);
      }

      .tex-status-warning,
      .tex-status-warning * {
        // --- タイポグラフィ ---
        color: var(--color-status-warning);
      }

      .tex-status-danger,
      .tex-status-danger * {
        // --- タイポグラフィ ---
        color: var(--color-status-danger);
      }

      .tex-color-accent,
      .tex-color-accent * {
        // --- タイポグラフィ ---
        color: var(--color-accent-main);
      }
    }

    :deep(.katex-display) {
      // --- ボックスモデル ---
      padding: var(--pad-element);
    }
  }

  &__legend {
    // --- レイアウト・配置 ---
    @include flex-column(var(--gap-element));

    flex-shrink: 0;

    // --- ボックスモデル ---
    width: 250px;
  }

  &__legend-title {
    // --- 継承 ---
    @extend %text-meta;

    // --- タイポグラフィ ---
    font-weight: var(--font-weight-bold);
    color: var(--color-text-muted);
  }

  &__legend-list {
    // --- レイアウト・配置 ---
    @include flex-column(var(--gap-element));

    list-style: none;
  }

  &__legend-item {
    // --- 継承 ---
    @extend %text-body-bold;

    // --- レイアウト・配置 ---
    display: flex;
    gap: var(--gap-element);
    align-items: flex-start;

    // --- タイポグラフィ ---
    color: var(--color-text-secondary);
  }

  &__legend-symbol {
    // --- タイポグラフィ ---
    color: var(--color-text-main);
  }

  &__legend-sep {
    // --- タイポグラフィ ---
    color: var(--color-text-muted);
  }

  &__legend-name {
    // --- レイアウト・配置 ---
    flex: 1;
  }
}
</style>
