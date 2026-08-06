<script setup lang="ts">
const emit = defineEmits<{
  (e: "click"): void;
}>();
</script>

<template>
  <NuxtLink to="/" class="c-logo" @click="emit('click')">
    <AppIcon name="zap" class="c-logo__icon" />
    <span class="c-logo__text">Elec-Console</span>
  </NuxtLink>
</template>

<style scoped lang="scss">
.c-logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;
  color: var(--color-text-main);
  transition: var(--transition-base);

  &:hover {
    .c-logo__icon {
      @include cyber-text-glow(60%, 8px, var(--color-category-main));
      transform: scale(1.1);
    }
  }

  &__icon {
    color: var(--color-category-main);
    width: 24px;
    height: 24px;
    transition: var(--transition-base);
  }

  &__text {
    font-size: var(--text-lg);
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.05em;
  }
}
</style>
