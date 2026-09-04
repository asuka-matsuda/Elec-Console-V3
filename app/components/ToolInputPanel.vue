<script setup lang="ts">
/**
 * ToolInputPanel
 * ツール等の条件入力エリアを囲むパネルコンポーネントです。
 */
defineProps<{
  title?: string
  icon?: string
}>()

defineEmits(['reset'])
</script>

<template>
  <AppPanel
    class="c-tool-panel"
    :title="title || '条件入力'"
    :icon="icon || 'edit'"
    variant="tool"
    size="md"
  >
    <template #actions>
      <AppButton variant="danger" size="sm" @click="$emit('reset')">
        <AppIcon name="refresh-cw" size="sm" />
        リセット
      </AppButton>
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
    padding-right: var(--space-1);
  }
}
</style>
