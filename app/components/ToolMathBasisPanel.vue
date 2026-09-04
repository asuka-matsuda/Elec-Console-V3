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
  <div class="c-basis-content">
    <ClientOnly>
      <div v-if="steps && steps.length > 0" class="c-basis-content__list">
        <AppCard
          v-for="(step, index) in steps"
          :key="index"
          class="c-basis-content__card"
          :title="step.title"
        >
          <ToolMathBasis :tex="step.tex" :legend="step.legend" />
        </AppCard>
      </div>
    </ClientOnly>

    <div v-if="$slots.default" class="c-basis-content__extra">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.c-basis-content {
  @include flex-start-stretch($direction: column);

  gap: var(--space-card-gap);

  &__list {
    @include flex-start-stretch($direction: column);

    gap: var(--space-card-gap);
  }

  &__card {
    gap: var(--space-3);
  }

  &__extra {
    @include flex-start-stretch($direction: column);

    gap: var(--space-2);
  }
}
</style>
