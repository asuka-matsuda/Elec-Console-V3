<script setup lang="ts">
import type { MathStep } from '../AppMathBasis.vue';

defineProps<{
  steps: MathStep[] | null;
}>();
</script>

<template>
  <AppPanel bracket-color="tool" class="c-basis-panel" style="flex: 1; min-height: 0">
    <template #header>
      <AppSectionHeader
        title="計算根拠"
        divider-type="fade-center"
        icon="book"
        variant="tool"
        size="md"
      />
    </template>
    
    <ClientOnly>
      <AppMathBasis v-if="steps && steps.length > 0" :steps="steps" />
    </ClientOnly>

    <div class="c-basis-panel__content">
      <slot />
    </div>
  </AppPanel>
</template>

<style scoped lang="scss">
/* 計算根拠エリアはスマホ表示時にカットするかどうかは親で制御可能ですが、一旦デフォルトで追従 */
.c-basis-panel {
  @include mq("md") {
    display: none !important;
  }
}

.c-basis-panel__content {
  margin-top: var(--gap-component);
}
</style>
