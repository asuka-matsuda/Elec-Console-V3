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
  variant?: "primary" | "secondary" | "danger" | "success";
  block?: boolean;
  icon?: string;
  iconOnly?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<AppButtonProps>(), {
  type: "button",
  size: "sm",
  variant: "primary",
  icon: undefined,
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
      variant !== 'primary' && `c-btn--${variant}`,
      size !== 'sm' && `c-btn--${size}`,
      {
        'c-btn--block': block,
        'c-btn--icon-only': iconOnly || (icon && !$slots.default),
        'is-disabled': disabled,
      },
    ]"
    @click="disabled && $event.preventDefault()"
  >
    <AppIcon
      v-if="icon"
      :name="icon"
    />
    <slot />
  </component>
</template>

<style scoped lang="scss">
.c-btn {
  --btn-color: var(--color-category-main);

  position: relative;

  flex-shrink: 0;

  height: var(--size-control-sm);
  padding: 0 var(--space-control-px);

  font-weight: var(--font-weight-semibold);

  // タップ領域の確保
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

  &--danger {
    --btn-color: var(--color-status-danger);
  }

  &--success {
    --btn-color: var(--color-status-success);
  }

  &--secondary {
    --btn-color: var(--color-status-neutral);
  }

  &--block {
    display: flex;
    width: 100%;
  }

  &:hover:not(:disabled, .is-disabled) {
    @include state-hover(var(--btn-color));
  }

  &:focus-visible {
    @include state-focus(var(--btn-color));
    @include cyber-text-glow(var(--btn-color));
  }

  &:active:not(:disabled, .is-disabled) {
    @include state-active(var(--btn-color));
    @include cyber-text-glow(var(--btn-color));
  }

  &:is(:disabled, .is-disabled) {
    @include disabled;
  }

  &--md {
    @include text-desc;

    height: var(--size-control-md);
    padding: 0 var(--space-control-px-md);
  }

  &--icon-only {
    width: var(--size-control-sm);
    padding: 0;

    :deep(.c-icon),
    .c-icon {
      width: 18px;
      height: 18px;

      svg {
        width: 100%;
        height: 100%;
      }
    }

    &.c-btn--md {
      width: var(--size-control-md);

      :deep(.c-icon),
      .c-icon {
        width: 22px;
        height: 22px;
      }
    }
  }

  @include click-enabled;
  @include text-meta;
  @include inline-flex-center(var(--space-inline-gap));
  @include border-dim(var(--btn-color));
  @include state-base(var(--shadow-elevation-sm), var(--transition-fast), var(--btn-color));
}
</style>
