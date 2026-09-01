<script setup lang="ts">
/**
 * ToolCalculationBasisPanel
 * 計算ツールの計算根拠（数式やステップ）を表示するためのパネルコンポーネントです。
 */
import type { MathStep } from '~/components/AppMathBasis.vue'

defineProps<{
  steps: MathStep[] | null
}>()
</script>

<template>
  <AppPanel
    bracket-color="tool"
    class="c-basis-panel"
  >
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
        <AppMathBasis
          v-if="steps && steps.length > 0"
          :steps="steps"
        />
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
    @include flex-column;
  }
}
</style>
