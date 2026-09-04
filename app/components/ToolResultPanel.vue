<script setup lang="ts">
import { computed, inject, type Ref, ref } from 'vue'

/**
 * ToolResultPanel
 * ツールの計算結果や選定結果を表示し、保存アクション等を提供するパネルコンポーネントです。
 */
const props = defineProps<{
  title?: string
  icon?: string
  saveDisabled?: boolean
  saveFunction?: () => Promise<void>
}>()

const openBasis = inject<(() => void) | null>('openToolBasis', null)
const hasBasis = inject<Ref<boolean>>('hasToolBasis', ref(false))

const typedSaveFunction = computed(
  () => props.saveFunction as () => Promise<void>,
)
</script>

<template>
  <AppPanel
    class="c-tool-panel"
    :title="title || '計算結果・選定結果'"
    :icon="icon || 'check-square'"
    variant="tool"
    size="md"
  >
    <template #actions>
      <AppButton
        v-if="hasBasis && openBasis"
        variant="secondary"
        size="sm"
        @click="openBasis"
      >
        <AppIcon name="book" size="sm" />
        計算根拠
      </AppButton>
      <AppSaveButton
        :disabled="saveDisabled"
        :save-function="typedSaveFunction"
      />
    </template>

    <div class="c-tool-panel__content">
      <slot />
    </div>
  </AppPanel>
</template>

<style scoped lang="scss">
.c-tool-panel {
  flex: 1;
  min-height: 0;

  &__content {
    @include flex-start-stretch($direction: column);

    overflow-y: auto;
    flex: 1;
    gap: var(--space-card-gap);
    min-height: 0;
  }
}
</style>
