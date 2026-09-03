<script setup lang="ts">
/**
 * AppButton
 * 汎用的なボタンコンポーネント（ベース）
 */
import { computed, resolveComponent } from 'vue'

import type { BaseButtonProps } from '~/types/components'

export interface AppButtonProps extends BaseButtonProps {
  icon?: string
}

const props = withDefaults(defineProps<AppButtonProps>(), {
  type: 'button',
  size: 'sm',
  variant: 'primary',
})

const isClickable = computed(() => !props.disabled)

const componentTag = computed(() => {
  if (!isClickable.value) return 'button'
  if (props.to) return resolveComponent('NuxtLink')
  if (props.href) return 'a'

  return 'button'
})

const buttonClasses = computed(() => {
  return [
    'c-btn',
    props.variant !== 'primary' ? `c-btn--${props.variant}` : '',
    props.size !== 'sm' ? `c-btn--${props.size}` : '',
    props.block ? 'c-btn--block' : '',
  ].filter(Boolean)
})

const componentAttrs = computed(() => {
  const isButton = componentTag.value === 'button'

  return {
    to: props.to,
    href: props.href,
    type: isButton ? props.type : undefined,
    disabled: props.disabled ? true : undefined,
  }
})
</script>

<template>
  <component
    :is="componentTag"
    v-bind="componentAttrs"
    :class="buttonClasses"
  >
    <AppIcon v-if="icon" :name="icon" />
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

  &--md {
    @include text-label("md", "semibold");
  }
}
</style>
