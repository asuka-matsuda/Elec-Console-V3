<script setup lang="ts">
defineProps<{
  title?: string;
  icon?: string;
  saveDisabled?: boolean;
  saveFunction?: () => Promise<void>;
}>();

defineEmits(['save']);
</script>

<template>
  <AppPanel bracket-color="tool" class="c-tool-panel">
    <template #header>
      <AppSectionHeader
        :title="title || '計算結果・選定結果'"
        divider-type="fade-center"
        :icon="icon || 'check-square'"
        variant="tool"
        size="md"
      >
        <template #actions>
          <AppSaveButton
            :disabled="saveDisabled"
            :save-function="saveFunction as () => Promise<void>"
            @save="$emit('save')"
          />
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
