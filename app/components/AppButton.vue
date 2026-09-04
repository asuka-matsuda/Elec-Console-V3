<script setup lang="ts">
/**
 * AppButton
 * 汎用的なボタンコンポーネント（ベース）
 */
import { computed } from 'vue'

import { NuxtLink } from '#components'
import type { AppButtonProps } from '~/types/components'

const props = withDefaults(defineProps<AppButtonProps>(), {
  type: 'button',
  size: 'sm',
  variant: 'primary',
  loading: false,
})

const isClickable = computed(() => !props.disabled && !props.loading)

const componentTag = computed(() => {
  if (!isClickable.value) return 'button'
  if (props.to) return NuxtLink
  if (props.href) return 'a'

  return 'button'
})

const buttonClasses = computed(() => {
  return [
    'c-btn',
    props.variant !== 'primary' ? `c-btn--${props.variant}` : '',
    props.size !== 'sm' ? `c-btn--${props.size}` : '',
    props.block ? 'c-btn--block' : '',
    props.loading ? 'c-btn--loading' : '',
  ].filter(Boolean)
})

const componentAttrs = computed(() => {
  const isButton = componentTag.value === 'button'

  return {
    'to': props.to,
    'href': props.href,
    'type': isButton ? props.type : undefined,
    'disabled': !isClickable.value ? true : undefined,
    'aria-busy': props.loading ? true : undefined,
  }
})
</script>

<template>
  <component
    :is="componentTag"
    v-bind="componentAttrs"
    :class="buttonClasses"
  >
    <AppIcon v-if="loading" name="loader" class="u-spin c-btn__spinner" />
    <AppIcon v-else-if="icon" :name="icon" />
    <slot />
  </component>
</template>

<style scoped lang="scss">
.c-btn {
  --btn-color: var(--theme-accent);

  @include flex-center-center($is-inline: true);
  @include text-label("sm", "semibold");
  @include click-enabled;

  position: relative;

  flex-shrink: 0;
  gap: var(--space-2);

  min-height: 2.6em;
  padding-block: 0.3em;
  padding-inline: 1.2em;

  color: var(--btn-color);

  @include border-base(var(--btn-color), 30%);
  @include state-base("sm", var(--transition-fast), var(--btn-color));

  :deep(.c-icon) {
    width: 1.2em;
    height: 1.2em;
  }

  &:disabled {
    @include disabled;
  }

  &:not(:disabled) {
    &:hover {
      @include state-hover(var(--btn-color), "md");
    }

    &:focus-visible {
      @include state-focus(var(--btn-color), "md");
    }

    &:active {
      @include state-active(var(--btn-color), "md");
    }
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
    width: 100%;
  }

  &--loading {
    pointer-events: none;
    cursor: wait;
    opacity: 0.8;
  }

  &--md {
    @include text-label("md", "semibold");
  }
}
</style>
