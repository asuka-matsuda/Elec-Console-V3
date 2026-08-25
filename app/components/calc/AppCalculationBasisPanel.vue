<script setup lang="ts">
/**
 * AppCalculationBasisPanel
 * 計算ツールの計算根拠（数式やステップ）を表示するためのパネルコンポーネントです。
 */
import type { MathStep } from '../AppMathBasis.vue';

defineProps<{
  steps: MathStep[] | null;
}>();
</script>

<template>
  <AppPanel bracket-color="tool" class="c-basis-panel">
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
        <AppMathBasis v-if="steps && steps.length > 0" :steps="steps" />
      </ClientOnly>

      <div class="c-basis-panel__content">
        <slot />
      </div>
    </div>
  </AppPanel>
</template>

<style scoped lang="scss">
.c-basis-panel {
  // --- レイアウト・配置 ---
  flex: 1;

  // --- ボックスモデル ---
  min-height: 0;

  @include mq("md") {
    // --- レイアウト・配置 ---
    display: none;
  }

  // --- 子要素 ---
  &__layout {
    // --- レイアウト・配置 ---
    @include flex-column(var(--gap-component));
  }
}
</style>
