<script setup lang="ts">
defineProps<{
  label: string;
  topBorder?: boolean;
}>();
</script>

<template>
  <div class="p-result-details__row" :class="{ 'has-top-border': topBorder }">
    <span>{{ label }}</span>
    <span><slot /></span>
  </div>
</template>

<style scoped lang="scss">
.p-result-details__row {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  
  :slotted(strong) {
    color: var(--color-text-main);
  }

  &.has-top-border {
    border-top: 1px dashed var(--color-border);
    padding-top: 8px;
    margin-top: 4px;
  }
}
</style>
