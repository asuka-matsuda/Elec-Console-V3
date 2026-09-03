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
  <AppPanel title="入力">
    <template #header>
      <AppSectionHeader
        :title="title || '条件入力'"
        divider-type="fade-center"
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
      </AppSectionHeader>
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

    gap: var(--space-card-gap);
  }
}
</style>
