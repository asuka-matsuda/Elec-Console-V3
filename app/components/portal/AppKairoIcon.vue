<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  type: string;
}>();

const variantClass = computed(() => {
  switch (props.type) {
    case 'L': return 'c-kairo-icon--light';
    case 'P': return 'c-kairo-icon--power';
    case 'C': return 'c-kairo-icon--control';
    case 'M': return 'c-kairo-icon--main';
    case 'E': return 'c-kairo-icon--earth';
    default: return 'c-kairo-icon--default';
  }
});
</script>

<template>
  <span :class="['c-kairo-icon', variantClass]">
    {{ type }}
  </span>
</template>

<style scoped lang="scss">
.c-kairo-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
  color: #fff;

  &--light { background-color: #f59e0b; }
  &--power { background-color: #ef4444; }
  &--control { background-color: #3b82f6; }
  &--main { background-color: #8b5cf6; }
  &--earth { background-color: #10b981; }
  &--default { background-color: #6b7280; }
}
</style>