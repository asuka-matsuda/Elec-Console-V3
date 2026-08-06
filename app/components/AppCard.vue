<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  variant?: "default" | "tool" | "database" | "reference" | "management";
  to?: string;
  href?: string;
  disabled?: boolean;
  elevated?: boolean;
}>();

const rootTag = computed(() => {
  if (props.to) return "NuxtLink";
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
    :class="[
      variant ? `c-card--${variant}` : '',
      elevated ? 'c-card--elevated' : 'c-card--flat',
      { 'is-disabled': disabled },
    ]"
  >
    <slot />
  </component>
</template>

<style scoped lang="scss">
.c-card {
  position: relative;
  padding: var(--pad-card, var(--space-4));
  text-decoration: none; // Reset for links
  display: flex;
  flex-direction: column;
  color: var(--color-text-main);
  transition: var(--transition-base);
  @include ui-surface(15%);

  // Elevation (浮き上がり) / Flat (平坦)
  &--flat {
    box-shadow: none;
  }

  &--elevated {
    box-shadow: var(--shadow-elevation-base);
    // 浮き上がっている感強調のため、上部のボーダーを少し明るくする
    border-top-color: glass-color(30%);
  }

  // Interactive link styles
  &:is(a, button) {
    cursor: pointer;

    &:not(.is-disabled):hover {
      @include ui-hover-glow(var(--card-accent, var(--color-category-main)));
    }

    &:not(.is-disabled):active {
      @include ui-active(var(--card-accent, var(--color-category-main)));
    }
  }

  &.is-disabled {
    pointer-events: none;
    opacity: 0.5;
    filter: grayscale(100%);
  }

  // Variants
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
