<script setup lang="ts">
/**
 * AppButton
 * 汎用的なボタンコンポーネント（ベース）
 */
import { computed } from 'vue'

export interface AppButtonProps {
  to?: string
  href?: string
  type?: 'button' | 'submit' | 'reset'
  size?: 'sm' | 'md'
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  block?: boolean
  icon?: string
  iconOnly?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<AppButtonProps>(), {
  type: 'button',
  size: 'sm',
  variant: 'primary',
  icon: undefined,
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
    props.iconOnly ? 'c-btn--icon-only' : '',
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
  @include text-meta("md", "semibold");
  @include click-enabled;

  position: relative;

  flex-shrink: 0;
  gap: var(--space-2);

  height: var(--size-control-sm);
  padding: 0 var(--space-3);

  @include border-base(var(--btn-color), 30%);
  @include state-base(var(--shadow-elevation-sm), var(--transition-fast), var(--btn-color));

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
    @include text-desc;

    height: var(--size-control-md);
    padding: 0 var(--space-4);
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
}
</style>
