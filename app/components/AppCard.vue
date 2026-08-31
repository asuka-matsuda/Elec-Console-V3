<script setup lang="ts">
/**
 * AppCard
 * コンテンツをまとめるためのカード型コンポーネント
 */
import { computed, resolveComponent } from "vue";

const props = defineProps<{
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
    :class="{ 'is-disabled': disabled }"
  >
    <slot />
  </component>
</template>

<style scoped lang="scss">
.c-card {
  position: relative;

  @include flex-column(var(--space-card-gap));

  padding: var(--space-card-pad);

  @include state-base;
  @include border-base;

  &:is(a, button) {
    @include click-enabled;

    &:not(.is-disabled):hover {
      @include state-hover(var(--theme-accent));
    }

    &:not(.is-disabled):focus-visible {
      @include state-focus(var(--theme-accent));
    }

    &:not(.is-disabled):active {
      @include state-active(var(--theme-accent));
    }
  }

  &.is-disabled {
    @include disabled;
  }
}
</style>
