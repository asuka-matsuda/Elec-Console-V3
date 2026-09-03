<script setup lang="ts">
/**
 * ToolCalculationBasisPanel
 * 計算ツールの計算根拠（数式やステップ）を表示するためのパネルコンポーネントです。
 */
import { computed } from 'vue'

import type { MathStep } from '~/components/AppMathBasis.vue'
import { parseLegend, renderMath } from '~/utils/mathUtils'

const props = defineProps<{
  steps: MathStep[] | null
}>()

const unifiedLegend = computed(() => {
  if (!props.steps) return []

  const allLegends = props.steps.flatMap(step => step.legend || [])
  // 重複排除 (同じ文字列 "P: 電力" が複数回登場した場合、1つにまとめる)
  const uniqueLegends = Array.from(new Set(allLegends))

  return parseLegend(uniqueLegends).map(leg => ({
    ...leg,
    renderedSymbol: renderMath(leg.symbol, false),
  }))
})
</script>

<template>
  <AppPanel title="計算の根拠">
    <template #header>
      <AppSectionHeader
        title="計算根拠"
        divider-type="fade-center"
        icon="book"
        variant="tool"
        size="md"
      />
    </template>

    <div class="c-basis-panel__layout">
      <ClientOnly>
        <div v-if="steps && steps.length > 0" class="c-basis-panel__list">
          <AppCard
            v-for="(step, index) in steps"
            :key="index"
            class="c-basis-panel__card"
          >
            <AppSectionHeader
              v-if="step.title"
              :title="step.title"
              tag="h4"
              variant="tool"
              size="sm"
            />
            <AppMathBasis :tex="step.tex" />
          </AppCard>

          <div v-if="unifiedLegend.length > 0" class="c-basis-panel__legend">
            <h5 class="c-basis-panel__legend-title">【凡例】</h5>
            <dl class="c-basis-panel__legend-list">
              <template v-for="v in unifiedLegend" :key="v.name">
                <dt v-html="v.renderedSymbol"></dt>
                <dd>{{ v.name }}</dd>
              </template>
            </dl>
          </div>
        </div>
      </ClientOnly>

      <div class="c-basis-panel__content">
        <slot />
      </div>
    </div>
  </AppPanel>
</template>

<style scoped lang="scss">
.c-basis-panel {
  flex: 1;
  min-height: 0;

  @include mq("md") {
    display: none;
  }

  &__layout {
    @include flex-start-stretch($direction: column);
  }

  &__list {
    @include flex-start-stretch(column);

    gap: var(--space-card-gap);
  }

  &__card {
    gap: var(--space-3);
  }

  &__legend {
    @include flex-start-stretch(column);

    gap: var(--space-1);
    padding: var(--space-2) var(--space-3);
    background-color: var(--color-bg-base);
    border-radius: var(--radius-md);
  }

  &__legend-title {
    @include text-meta("xs", "bold");

    color: var(--color-text-muted);
  }

  &__legend-list {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: var(--space-1) var(--space-2);
    align-items: baseline;

    dt {
      color: var(--color-text-muted);

      &::after {
        content: ":";
        margin-left: var(--space-1);
        color: var(--color-text-muted);
      }

      :deep(.katex) {
        color: var(--color-text-muted);
      }
    }

    dd {
      @include text-meta("2xs", "regular");

      margin: 0;
      color: var(--color-text-muted);
    }
  }
}
</style>
