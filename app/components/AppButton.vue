<script setup lang="ts">
/**
 * AppButton
 * 汎用的なボタンコンポーネント（ベース）
 */
import { computed } from "vue";
export interface AppButtonProps {
  to?: string;
  href?: string;
  type?: "button" | "submit" | "reset";
  size?: "sm" | "md";
  iconOnly?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<AppButtonProps>(), {
  type: "button",
  size: "sm",
});

const componentTag = computed(() => {
  if (props.to) return "NuxtLink";
  if (props.href) return "a";
  return "button";
});
</script>

<template>
  <component
    :is="componentTag"
    :to="!disabled ? to : null"
    :href="!disabled ? href : null"
    :type="componentTag === 'button' ? type : null"
    :disabled="componentTag === 'button' ? disabled : null"
    class="c-btn"
    :class="[
      size !== 'sm' && `c-btn--${size}`,
      {
        'c-btn--icon-only': iconOnly,
        'is-disabled': disabled,
      },
    ]"
    @click="disabled && $event.preventDefault()"
  >
    <slot />
  </component>
</template>

<style scoped lang="scss">
.c-btn {
  --btn-color: var(--color-category-main);

  @extend %click-enabled;
  @extend %text-xs;

  @include flex-center(var(--pad-component), inline-flex);

  position: relative;

  flex-shrink: 0;

  height: var(--size-control-sm);
  padding: 0 var(--pad-component);

  font-weight: var(--font-weight-semibold);

  @include border-dim(50%, var(--btn-color));
  @include state-base(var(--shadow-elevation-sm), var(--transition-fast));

  &::after {
    content: "";

    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    width: 100%;
    min-width: var(--size-control-lg);
    height: 100%;
    min-height: var(--size-control-lg);
  }

  &:hover:not(:disabled, .is-disabled) {
    z-index: 1;

    @include state-hover(var(--btn-color));
  }

  &:focus-visible {
    z-index: 1;

    @include state-focus(var(--btn-color));
    @include cyber-text-glow(var(--btn-color));
  }

  &:active:not(:disabled, .is-disabled) {
    z-index: 1;

    @include state-active(var(--btn-color));
    @include cyber-text-glow(var(--btn-color));
  }

  &:is(:disabled, .is-disabled) {
    @extend %disabled;
  }

  &--md {
    @extend %text-sm;

    height: var(--size-control-md);
    padding: 0 var(--pad-container);
  }

  &--icon-only {
    width: var(--size-control-sm);
    padding: 0;

    &.c-btn--md {
      width: var(--size-control-md);
    }
  }
}
</style>