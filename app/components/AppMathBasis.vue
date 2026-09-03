<script setup lang="ts">
import "katex/dist/katex.min.css";

import katex from "katex";
import { computed } from "vue";

export type MathStep = {
  title?: string;
  tex: string;
  legend?: string[];
};

const props = defineProps<{
  steps: MathStep[];
}>();

// --- ヘルパー関数 ---
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

const parseLegend = (legendArray: string[] | undefined) => {
  if (!legendArray) return [];

  return legendArray.map((leg) => {
    const parts = leg.split(":");
    let rawSymbol = parts[0]?.trim() || "";

    rawSymbol = rawSymbol.replace(/\\\(/g, "").replace(/\\\)/g, "").trim();
    const name = parts.slice(1).join(":")?.trim() || leg;

    return { symbol: rawSymbol, name };
  });
};

// 💡 改善1: computedを使って、データを事前にすべてHTML化しておく（再描画時の激重処理を回避）
const parsedSteps = computed(() => {
  return props.steps.map((step) => ({
    ...step,
    renderedTex: renderMath(step.tex, true),
    parsedLegend: parseLegend(step.legend).map((leg) => ({
      ...leg,
      renderedSymbol: renderMath(leg.symbol, false),
    })),
  }));
});
</script>

<template>
  <!-- 💡 無駄な template ラッパーを削除し、大元に v-if を統合 -->
  <div v-if="parsedSteps.length > 0" class="c-math-basis">
    <AppCard
      v-for="(step, index) in parsedSteps"
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
        <!-- 💡 計算済みのHTMLをバインドするだけなので超軽量！ -->
        <div class="c-math-basis__math" v-html="step.renderedTex"></div>

        <div v-if="step.parsedLegend.length > 0" class="c-math-basis__legend">
          <h5 class="c-math-basis__legend-title">【凡例】</h5>
          <dl class="c-math-basis__legend-list">
            <template v-for="v in step.parsedLegend" :key="v.name">
              <dt v-html="v.renderedSymbol"></dt>
              <dd>{{ v.name }}</dd>
            </template>
          </dl>
        </div>
      </div>
    </AppCard>
  </div>
</template>

<style scoped lang="scss">
.c-math-basis {
  @include flex-start-stretch(column);

  overflow-y: auto;
  flex: 1;
  gap: var(--space-card-gap);

  padding-right: var(--space-2);
  padding-bottom: var(--space-layout-pad);

  &__card {
    gap: var(--space-3);
  }

  &__body {
    @include flex-start-start;

    // 💡 改善2: wrapを許可して、スマホで縦積みになるようにする
    flex-wrap: wrap;
    gap: var(--space-card-gap);
  }

  &__math {
    // スクロールバー自体は非表示にしつつスクロールは可能にする（ノイズレスな美しいUI）
    scrollbar-width: none;

    overflow-x: auto;
    flex: 1 1 300px; // 最低300pxは確保し、それ以上は伸びる

    // 💡 width: 100% を追加して、スマホ時に単独で全幅を取れるようにする
    width: 100%;
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
    @include flex-start-stretch(column);

    // 💡 改善2: スマホ時は100%幅で下部に配置され、PC時は250px幅になる
    flex: 1 1 100%;
    flex-shrink: 0;
    gap: var(--space-1);

    @include mq("md") {
      flex: 0 0 250px;
    }
  }

  &__legend-title {
    @include text-meta("md", "bold");

    color: var(--color-text-muted);
  }

  &__legend-list {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: var(--space-1) var(--space-2);
    align-items: baseline;

    dt {
      color: var(--color-text-main);

      &::after {
        content: ":";
        color: var(--color-text-muted);
        margin-left: var(--space-1);
      }
    }

    dd {
      margin: 0;
      color: var(--color-text-secondary);

      @include text-body("md", "bold");
    }
  }
}
</style>
