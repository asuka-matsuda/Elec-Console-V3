<script setup lang="ts">
import type { MenuSection } from "~/utils/menuData";

withDefaults(
  defineProps<{
    title?: string;
    icon?: string;
    variant?: MenuSection["accent"];
    size?: "md" | "lg";
    dividerType?: "default" | "fade-side" | "fade-center";
  }>(),
  {
    variant: "main",
    size: "lg",
    dividerType: "default",
  },
);
</script>

<template>
  <header class="c-section-header">
    <h2
      class="c-section-header__title"
      :class="[`c-section-header__title--${size}`]"
      :style="`--section-color: var(--color-category-${variant})`"
    >
      <AppIcon v-if="icon" :name="icon" class="c-section-header__icon" />
      <slot>{{ title }}</slot>
    </h2>
    <AppDivider :variant="variant" :type="dividerType" />
  </header>
</template>

<style scoped lang="scss">
.c-section-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);

  &__title {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
    margin: 0;

    &--lg {
      font-size: var(--text-xl);
    }

    &--md {
      font-size: var(--text-lg);
    }
  }

  &__icon {
    color: var(--section-color);
  }
}
</style>
