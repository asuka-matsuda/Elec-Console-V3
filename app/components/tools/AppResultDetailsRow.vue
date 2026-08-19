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
  
  /* stylelint-disable-next-line selector-pseudo-class-no-unknown */
  :slotted(strong) {
    color: var(--color-text-main);
  }

  /* stylelint-disable-next-line selector-pseudo-class-no-unknown */
  :slotted(.p-badge) {
    flex-shrink: 0;
  }

  &.has-top-border {
    border-top: 1px solid var(--color-border);
    padding-top: 8px;
    margin-top: 4px;
  }
}
</style>
