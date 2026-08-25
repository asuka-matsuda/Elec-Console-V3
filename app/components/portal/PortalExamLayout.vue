<script setup lang="ts">
import AppPanel from '~/components/ui/AppPanel.vue';

defineProps<{
  title: string;
  icon?: string;
}>();
</script>

<template>
  <div class="p-portal-exam-layout">
    <AppPanel :heading="title" :icon="icon">
      <div class="p-portal-exam-layout__header">
        <div class="p-portal-exam-layout__summary">
          <slot name="summary"></slot>
        </div>
        <div class="p-portal-exam-layout__actions">
          <slot name="actions"></slot>
        </div>
      </div>
      
      <div class="p-portal-exam-layout__table-wrapper">
        <slot name="table"></slot>
      </div>
    </AppPanel>
  </div>
</template>

<style scoped lang="scss">
.p-portal-exam-layout {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  &__summary {
    font-size: 0.875rem;
    color: var(--color-text-muted, #6b7280);
  }
  
  &__actions {
    display: flex;
    gap: 0.5rem;
  }
  
  &__table-wrapper {
    overflow-x: auto;
  }
}
</style>