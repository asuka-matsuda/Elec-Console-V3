<script setup lang="ts">
/**
 * ToolCalculationBasisPanel
 * 計算ツールの計算根拠（数式やステップ）を表示するためのパネルコンポーネントです。
 */
import type { MathStep } from '~/components/ToolMathBasis.vue'

defineProps<{
  steps: MathStep[] | null
}>()
</script>

<template>
  <AppPanel
    class="c-basis-panel"
    title="計算根拠"
    icon="book"
    variant="tool"
    size="md"
  >
    <div class="c-basis-panel__layout">
      <ClientOnly>
        <div v-if="steps && steps.length > 0" class="c-basis-panel__list">
          <AppCard
            v-for="(step, index) in steps"
            :key="index"
            class="c-basis-panel__card"
            :title="step.title"
          >
            <ToolMathBasis :tex="step.tex" :legend="step.legend" />
          </AppCard>
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

    overflow-y: auto;
    flex: 1;
    gap: var(--space-card-gap);

    min-height: 0;
    padding-right: var(--space-1);
  }

  &__list {
    @include flex-start-stretch(column);

    gap: var(--space-card-gap);
  }

  &__card {
    gap: var(--space-3);
  }
}
</style>
