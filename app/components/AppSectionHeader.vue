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
    <div class="c-section-header__top">
      <h2
        class="c-section-header__title"
        :class="[`c-section-header__title--${size}`]"
        :style="`--section-color: var(--color-category-${variant})`"
      >
        <AppIcon v-if="icon" :name="icon" class="c-section-header__icon" />
        <slot>{{ title }}</slot>
      </h2>
      <div v-if="$slots.actions" class="c-section-header__actions">
        <slot name="actions" />
      </div>
    </div>
    <AppDivider :variant="variant" :type="dividerType" />
  </header>
</template>

<style scoped lang="scss">
.c-section-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);

  &__top {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    width: 100%;
    gap: var(--space-4);
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  &__title {
    display: flex;
    align-items: center;
    gap: var(--gap-component);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
    margin: 0;

    &--lg {
      font-size: var(--font-size-xl);
    }

    &--md {
      font-size: var(--font-size-lg);
    }
  }

  &__icon {
    color: var(--section-color);
  }
}
</style>
