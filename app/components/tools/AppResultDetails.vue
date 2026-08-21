<script setup lang="ts">
</script>

<template>
  <div class="p-result-details">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.p-result-details {
  // --- Base Styles ---
  display: flex;
  flex-direction: column;
  gap: var(--gap-element);

  padding-top: var(--gap-section);
  border-top: 1px solid var(--color-border);
}
</style>
