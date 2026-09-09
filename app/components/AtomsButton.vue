<script setup lang="ts">
/**
 * AtomsButton
 * [Atoms] 汎用的なボタン・リンクボタンコンポーネント（最小パーツ）
 */
import { computed } from 'vue'

import { NuxtLink } from '#components'
import type { AtomsButtonProps } from '~/types/components'

const {
  to,
  href,
  type = 'button',
  size = 'sm',
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  iconOnly = false,
  block,
} = defineProps<AtomsButtonProps>()

const isClickable = computed(() => !disabled && !loading)
const target = computed(() => to || href)
</script>

<template>
  <component
    :is="target && isClickable ? NuxtLink : 'button'"
    :to="target && isClickable ? target : undefined"
    :type="!target ? type : undefined"
    :disabled="!isClickable ? true : undefined"
    :aria-busy="loading ? true : undefined"
    class="relative z-[1] inline-flex shrink-0 items-center justify-center gap-2 btn"
    :class="[
      `btn--${variant}`,
      `btn--${size}`,
      {
        'w-full btn--block': block,
        'btn--loading': loading,
        'btn--icon-only': iconOnly,
        'is-disabled': !isClickable,
      },
    ]"
  >
    <AtomsIcon v-if="loading" name="loader" class="u-spin btn__spinner" />
    <AtomsIcon v-else-if="icon" :name="icon" />
    <slot />
  </component>
</template>

<style scoped lang="scss">
.btn {
  --btn-color: var(--theme-accent);
  --glow-color: var(--btn-color);

  cursor: pointer;
  user-select: none;

  min-height: 2.6em;
  padding-block: 0.3em;
  padding-inline: 1.2em;
  border: var(--border-width-base) solid color-mix(in srgb, var(--btn-color) 30%, transparent);
  border-radius: var(--radius-sm);

  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  color: var(--btn-color);
  text-decoration: none;
  letter-spacing: var(--tracking-wide);

  background-color: var(--surface-bg-elevated);
  box-shadow: var(--shadow-elevation-sm);

  transition: var(--transition-fast);

  :deep(.icon) {
    width: 1.2em;
    height: 1.2em;
  }

  &:disabled,
  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.5;
    filter: grayscale(100%);
  }

  &:not(:disabled, .is-disabled) {
    &:hover {
      border-color: var(--btn-color);
      box-shadow: var(--shadow-glow-hover);
      transition: var(--transition-glow);
    }

    &:focus-visible {
      border-color: color-mix(in srgb, var(--btn-color) 60%, transparent);
      outline: none;
      box-shadow: var(--shadow-glow-focus);
      transition: var(--transition-glow);
    }

    &:active {
      border-color: var(--btn-color);
      box-shadow: var(--shadow-glow-active);
      transition: var(--transition-glow);

      svg {
        filter: var(--drop-shadow-glow-xs);
        stroke: var(--btn-color);
      }
    }
  }

  &--primary {
    border-color: transparent;
    color: hsl(0deg 0% 100%);
    background-color: var(--btn-color);

    &:not(:disabled, .is-disabled) {
      &:hover {
        color: hsl(0deg 0% 100%);
        background-color: color-mix(in srgb, var(--btn-color) 85%, white);
      }

      &:active {
        color: hsl(0deg 0% 100%);
        background-color: color-mix(in srgb, var(--btn-color) 85%, black);
      }
    }
  }

  &--danger {
    --btn-color: var(--color-status-danger);
  }

  &--success {
    --btn-color: var(--color-status-success);
  }

  &--secondary {
    --btn-color: var(--color-border);

    color: var(--color-text-main);

    &:not(:disabled, .is-disabled) {
      &:hover {
        border-color: var(--color-text-muted);
        color: var(--color-text-main);
        background-color: var(--color-bg-hover);
      }
    }
  }

  &--ghost {
    border-color: transparent;
    color: var(--color-text-secondary);
    background-color: transparent;
    box-shadow: none;

    &:not(:disabled, .is-disabled) {
      &:hover {
        border-color: transparent;
        color: var(--theme-accent);
        background-color: var(--color-bg-hover);
        box-shadow: none;
      }

      &:active {
        background-color: color-mix(in srgb, var(--color-overlay) 10%, transparent);
      }
    }
  }

  &--block {
    width: 100%;
  }

  &--icon-only {
    width: 2.6em;
    min-width: 2.6em;
    padding-inline: 0;
  }

  &--loading {
    pointer-events: none;
    cursor: wait;
    opacity: 0.8;
  }

  &--md {
    font-size: var(--font-size-base);
  }
}
</style>
