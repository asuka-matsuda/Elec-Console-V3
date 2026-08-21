<script setup lang="ts">
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
/* 計算根拠エリアはスマホ表示時にカットするかどうかは親で制御可能ですが、一旦デフォルトで追従 */
.c-basis-panel {
  flex: 1;
  min-height: 0;

  @include mq("md") {
    display: none;
  }

  &__layout {
    display: flex;
    flex-direction: column;
    gap: var(--gap-component);
  }
}
</style>
