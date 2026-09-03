<script setup lang="ts">
import 'katex/dist/katex.min.css'

import katex from 'katex'
import { computed } from 'vue'

export type MathStep = {
  title?: string
  tex: string
  legend?: string[]
}

const props = defineProps<{
  tex: string
  legend?: string[]
}>()

// --- ヘルパー関数 ---
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

const parseLegend = (legendArray: string[] | undefined) => {
  if (!legendArray) return []

  return legendArray.map((leg) => {
    const parts = leg.split(':')
    let rawSymbol = parts[0]?.trim() || ''

    rawSymbol = rawSymbol.replace(/\\\(/g, '').replace(/\\\)/g, '').trim()
    const name = parts.slice(1).join(':')?.trim() || leg

    return { symbol: rawSymbol, name }
  })
}

// 💡 改善1: computedを使って、データを事前にすべてHTML化しておく（再描画時の激重処理を回避）
const renderedTex = computed(() => renderMath(props.tex, true))

const parsedLegend = computed(() => {
  return parseLegend(props.legend).map(leg => ({
    ...leg,
    renderedSymbol: renderMath(leg.symbol, false),
  }))
})
</script>

<template>
  <div class="c-math-basis">
    <div class="c-math-basis__math" v-html="renderedTex"></div>

    <div v-if="parsedLegend.length > 0" class="c-math-legend">
      <h5 class="c-math-legend__title">【凡例】</h5>
      <dl class="c-math-legend__list">
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
  @include flex-start-stretch(column);

  gap: var(--space-card-gap);

  &__math {
    min-width: 0;

    :deep(.katex) {
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
    }

  }
}

.c-math-legend {
  @include flex-start-stretch(column);
  @include text-meta("xs", "bold");

  gap: var(--space-1);
  color: var(--color-text-muted);

  &__title {
    margin: 0;
  }

  &__list {
    @include grid(max-content 1fr, var(--space-1) var(--space-2));

    align-items: baseline;

    dt {
      &::after {
        content: ":";
        margin-left: var(--space-1);
      }
    }

    dd {
      @include text-meta("2xs", "regular");

      margin: 0;
    }
  }
}
</style>
