<script setup lang="ts">
/**
 * AtomsButton
 * [Atoms] 汎用的なボタン・リンクボタンコンポーネント（最小パーツ）
 */
import { computed, useSlots } from 'vue'

import { NuxtLink } from '#components'
import type { AtomsButtonProps } from '~/types/components'

const {
  to,
  href,
  type = 'button',
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  iconOnly = false,
  block,
} = defineProps<AtomsButtonProps>()

const slots = useSlots()
const isClickable = computed(() => !disabled && !loading)
const isIconOnly = computed(() => iconOnly || (Boolean(icon) && !slots.default))
const target = computed(() => to || href)
</script>

<template>
  <component
    :is="target && isClickable ? NuxtLink : 'button'"
    :to="target && isClickable ? target : undefined"
    :type="!target ? type : undefined"
    :disabled="!isClickable ? true : undefined"
    class="relative z-[1] inline-flex shrink-0 items-center justify-center gap-2 btn"
    :class="[
      `btn--${variant}`,
      {
        'w-full': block,
        'btn--loading': loading,
        'btn--icon-only': isIconOnly,
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
  // デフォルト変数 (primary / theme-accent 基準)
  --btn-color: var(--theme-accent);
  --btn-bg: transparent;
  --btn-bg-hover: color-mix(in srgb, var(--btn-color) 12%, transparent);
  --btn-bg-active: color-mix(in srgb, var(--btn-color) 24%, transparent);
  --btn-border: color-mix(in srgb, var(--btn-color) 40%, transparent);
  --btn-border-hover: var(--btn-color);
  --btn-text: var(--btn-color);
  --btn-text-hover: var(--btn-color);
  --glow-color: var(--btn-color);

  cursor: pointer;
  user-select: none;

  min-height: 2.6em;
  padding-block: 0.3em;
  padding-inline: 1.2em;
  border: var(--border-width-base) solid var(--btn-border);
  border-radius: var(--radius-sm);

  font-size: inherit;
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  color: var(--btn-text);
  text-decoration: none;
  letter-spacing: var(--tracking-wide);

  background-color: var(--btn-bg);
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
      border-color: var(--btn-border-hover);

      color: var(--btn-text-hover);

      background-color: var(--btn-bg-hover);
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
      border-color: var(--btn-border-hover);
      background-color: var(--btn-bg-active);
      box-shadow: var(--shadow-glow-active);
      transition: var(--transition-glow);

      svg {
        filter: var(--drop-shadow-glow-xs);
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
    --btn-color: var(--color-border);
    --btn-border: var(--color-border);
    --btn-border-hover: var(--color-text-muted);
    --btn-text: var(--color-text-main);
    --btn-text-hover: var(--color-text-main);
    --btn-bg-hover: var(--color-bg-hover);
    --btn-bg-active: color-mix(in srgb, var(--color-overlay) 10%, transparent);
  }

  &--icon-only {
    aspect-ratio: 1;
    padding: 0;
  }

  &--loading {
    pointer-events: none;
    cursor: wait;
    opacity: 0.8;
  }
}
</style>
