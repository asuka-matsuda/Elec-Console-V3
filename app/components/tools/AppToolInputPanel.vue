<script setup lang="ts">
defineProps<{
  title?: string;
  icon?: string;
}>();

defineEmits(['reset']);
</script>

<template>
  <AppPanel bracket-color="tool" style="flex: 1; min-height: 0">
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
    
    <div class="l-stack" style="gap: var(--gap-section);">
      <slot />
    </div>
  </AppPanel>
</template>
