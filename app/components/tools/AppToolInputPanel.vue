<script setup lang="ts">
defineProps<{
  title?: string;
  icon?: string;
}>();

defineEmits(['reset']);
</script>

<template>
  <AppPanel bracket-color="tool" class="c-tool-panel">
    <template #header>
      <AppSectionHeader
        :title="title || '条件入力'"
        divider-type="fade-center"
        :icon="icon || 'edit'"
        variant="tool"
        size="md"
      >
        <template #actions>
          <AppButtonDanger size="sm" @click="$emit('reset')">
            <AppIcon name="refresh-cw" size="sm" />
            リセット
          </AppButtonDanger>
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
    display: flex;
    flex-direction: column;
    gap: var(--gap-section);
  }
}
</style>
