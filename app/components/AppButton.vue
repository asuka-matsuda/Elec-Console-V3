<script setup lang="ts">
/**
 * AppButton
 * 汎用的なボタンコンポーネント（ベース）
 */
import { computed } from 'vue'

import type { AppButtonProps } from '~/types/components'

const {
  type = 'button',
  size = 'sm',
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  block,
} = defineProps<AppButtonProps>()

const isClickable = computed(() => !disabled && !loading)
</script>

<template>
  <button
    :type="type"
    :disabled="!isClickable ? true : undefined"
    :aria-busy="loading ? true : undefined"
    :class="[
      'c-btn',
      `c-btn--${variant}`,
      `c-btn--${size}`,
      { 'c-btn--block': block, 'c-btn--loading': loading },
    ]"
  >
    <AppIcon v-if="loading" name="loader" class="u-spin c-btn__spinner" />
    <AppIcon v-else-if="icon" :name="icon" />
    <slot />
  </button>
</template>

<style scoped lang="scss">
.c-btn {
  --btn-color: var(--theme-accent);

  cursor: pointer;
  user-select: none;

  position: relative;
  z-index: 1;

  display: inline-flex;
  flex-shrink: 0;
  gap: var(--space-2);
  align-items: center;
  justify-content: center;

  min-height: 2.6em;
  padding-block: 0.3em;
  padding-inline: 1.2em;
  border: var(--border-width-base) solid color-mix(in srgb, var(--btn-color) 30%, transparent);
  border-radius: var(--radius-sm);

  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  color: var(--btn-color);
  letter-spacing: var(--tracking-wide);

  background-color: var(--surface-bg-elevated);
  box-shadow: var(--shadow-elevation-sm);

  transition: var(--transition-fast);

  :deep(.c-icon) {
    width: 1.2em;
    height: 1.2em;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    filter: grayscale(100%);
  }

  &:not(:disabled) {
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
        filter: drop-shadow(0 0 2px var(--btn-color));
        stroke: var(--btn-color);
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
    font-size: var(--font-size-base);
  }
}
</style>
