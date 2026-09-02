<script setup lang="ts">
/**
 * AppButton
 * 汎用的なボタンコンポーネント（ベース）
 */
import { computed } from 'vue'

import type { BaseButtonProps } from '~/types/components'

export interface AppButtonProps extends BaseButtonProps {
  icon?: string
}

const props = withDefaults(defineProps<AppButtonProps>(), {
  type: 'button',
  size: 'sm',
  variant: 'primary',
})

const componentTag = computed(() => {
  if (props.to) return 'NuxtLink'
  if (props.href) return 'a'

  return 'button'
})

const buttonClasses = computed(() => {
  return [
    'c-btn',
    props.variant !== 'primary' ? `c-btn--${props.variant}` : '',
    props.size !== 'sm' ? `c-btn--${props.size}` : '',
    props.block ? 'c-btn--block' : '',
    props.disabled ? 'is-disabled' : '',
  ].filter(Boolean)
})

const componentAttrs = computed(() => {
  const isButton = componentTag.value === 'button'

  return {
    to: !props.disabled ? props.to : undefined,
    href: !props.disabled ? props.href : undefined,
    type: isButton ? props.type : undefined,
    disabled: isButton ? props.disabled : undefined,
    tabindex: props.disabled && !isButton ? -1 : undefined,
  }
})

const handleClick = (e: MouseEvent) => {
  if (props.disabled) {
    e.preventDefault()
    e.stopImmediatePropagation()
  }
}
</script>

<template>
  <component
    :is="componentTag"
    v-bind="componentAttrs"
    :class="buttonClasses"
    @click="handleClick"
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
  --btn-color: var(--theme-accent);

  @include flex-center-center($is-inline: true);
  @include text-meta("sm", "semibold");
  @include click-enabled;

  position: relative;

  flex-shrink: 0;
  gap: var(--space-2);

  height: var(--size-control-sm);
  padding: 0 var(--space-3);

  @include border-base(var(--btn-color), 30%);
  @include state-base(var(--shadow-elevation-sm), var(--transition-fast), var(--btn-color));

  &:hover:not(:disabled, .is-disabled) {
    @include state-hover(var(--btn-color), 'md');
  }

  &:focus-visible:not(:disabled, .is-disabled) {
    @include state-focus(var(--btn-color), 'md');
  }

  &:active:not(:disabled, .is-disabled) {
    @include state-active(var(--btn-color), 'md');
  }

  &:is(:disabled, .is-disabled) {
    @include disabled;
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
    @include text-meta("md", "semibold");

    height: var(--size-control-md);
    padding: 0 var(--space-4);
  }
}
</style>
