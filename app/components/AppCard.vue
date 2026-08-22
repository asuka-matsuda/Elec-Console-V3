<script setup lang="ts">
/**
 * AppCard
 * コンテンツをまとめるためのカード型コンポーネント
 */
import { computed, resolveComponent } from "vue";

const props = defineProps<{
  variant?:
    | "default"
    | "main"
    | "tool"
    | "database"
    | "reference"
    | "management";
  to?: string;
  href?: string;
  disabled?: boolean;
}>();

const rootTag = computed(() => {
  if (props.to) return resolveComponent("NuxtLink");
  if (props.href) return "a";
  return "div";
});

const rootProps = computed(() => {
  if (props.to) return { to: props.to };
  if (props.href) return { href: props.href };
  return {};
});
</script>

<template>
  <component
    :is="rootTag"
    v-bind="rootProps"
    class="c-card"
    :class="[variant ? `c-card--${variant}` : '', { 'is-disabled': disabled }]"
  >
    <slot />
  </component>
</template>

<style scoped lang="scss">
.c-card {
  // --- Base Styles ---
  position: relative;

  display: flex;
  flex-direction: column;

  padding: var(--pad-container);

  color: var(--color-text-main);
  text-decoration: none; /* Reset for links */

  transition: var(--transition-base);

  @include surface(15%);

  // --- State Modifiers ---
  &:is(a, button) {
    cursor: pointer;

    &:not(.is-disabled):hover {
      @include state-hover(var(--card-accent, var(--color-category-main)));
    }

    &:not(.is-disabled):active {
      @include state-active(var(--card-accent, var(--color-category-main)));
    }
  }

  &.is-disabled {
    pointer-events: none;
    opacity: 0.5;
    filter: grayscale(100%);
  }

  // --- Color Modifiers ---
  &--tool {
    --card-accent: var(--color-category-tool);
  }

  &--database {
    --card-accent: var(--color-category-database);
  }

  &--reference {
    --card-accent: var(--color-category-reference);
  }

  &--management {
    --card-accent: var(--color-category-management);
  }
}
</style>
