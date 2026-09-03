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
  tex: string;
  legend?: string[];
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
const renderedTex = computed(() => renderMath(props.tex, true));

const parsedLegend = computed(() => {
  return parseLegend(props.legend).map((leg) => ({
    ...leg,
    renderedSymbol: renderMath(leg.symbol, false),
  }));
});
</script>

<template>
  <div class="c-math-basis">
    <div class="c-math-basis__math" v-html="renderedTex"></div>

    <div v-if="parsedLegend.length > 0" class="c-math-basis__legend">
      <h5 class="c-math-basis__legend-title">【凡例】</h5>
      <dl class="c-math-basis__legend-list">
        <template v-for="v in parsedLegend" :key="v.name">
          <dt v-html="v.renderedSymbol"></dt>
          <dd>{{ v.name }}</dd>
        </template>
      </dl>
    </div>
  </div>
</template>

<style scoped lang="scss">
.c-math-basis {
  @include flex-start-start;

  flex-wrap: wrap;
  gap: var(--space-card-gap);

  &__math {
    scrollbar-width: none;
    overflow-x: auto;

    // flex-grow: 1 により空き領域を埋め、flex-basis: 300px で基準幅を持たせる
    flex: 1 1 300px;
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

    flex-shrink: 0;
    gap: var(--space-1);

    // デスクトップベース (幅固定)
    flex: 0 0 250px;

    @include mq("md") {
      flex: 1 1 100%;
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
        margin-left: var(--space-1);
        color: var(--color-text-muted);
      }
    }

    dd {
      @include text-body("md", "bold");

      margin: 0;
      color: var(--color-text-secondary);
    }
  }
}
</style>
