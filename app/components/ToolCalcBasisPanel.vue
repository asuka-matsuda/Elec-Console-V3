<script setup lang="ts">
/**
 * ToolCalculationBasisPanel
 * 計算ツールの計算根拠（数式やステップ）を表示するためのパネルコンポーネントです。
 */
import type { MathStep } from "~/components/AppMathBasis.vue";

defineProps<{
  steps: MathStep[] | null;
}>();
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
            <AppMathBasis :tex="step.tex" :legend="step.legend" />
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

    // パネル全体をflex-growさせつつはみ出た分だけスクロールさせる場合、
    // ここで overflow や min-height の制御が必要な場合があります
    flex: 1;
    min-height: 0;
  }

  &__list {
    @include flex-start-stretch(column);

    overflow-y: auto;
    flex: 1;
    gap: var(--space-card-gap);
    padding-right: var(--space-2);
    padding-bottom: var(--space-layout-pad);
  }

  &__card {
    gap: var(--space-3);
  }
}
</style>
