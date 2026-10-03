<script setup lang="ts">
/**
 * Button
 * 汎用ボタンコンポーネント。
 * - to 指定時は NuxtLink、未指定時は button 要素を描画
 */
import { computed } from 'vue'

import { NuxtLink } from '#components'
import type { ButtonProps } from '~/types/components'

const {
  to,
  type = 'button',
  variant = 'default',
  disabled = false,
  loading = false,
  icon,
  title,
} = defineProps<ButtonProps>()

const isLink = computed(() => Boolean(to) && !disabled && !loading)
</script>

<template>
  <component
    :is="isLink ? NuxtLink : 'button'"
    :to="isLink ? to : undefined"
    :type="isLink ? undefined : type"
    :disabled="!isLink && (disabled || loading)"
    :title="title"
    class="relative inline-flex shrink-0 items-center justify-center btn"
    :class="[
      `btn--${variant}`,
      {
        'btn--icon': Boolean(icon) && !$slots.default,
        'is-loading': loading,
      },
    ]"
  >
    <span class="inline-flex items-center justify-center gap-inline-gap btn-content">
      <Icon v-if="icon" :name="icon" />
      <slot />
    </span>

    <span
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center"
    >
      <Icon name="loader" spin />
    </span>
  </component>
</template>

<style scoped lang="scss">
.btn {
  // Default
  --btn-bg: var(--btn-default-bg);
  --btn-border: var(--btn-default-border);
  --btn-border-hover: var(--btn-default-border-hover);
  --btn-bg-hover: var(--btn-default-bg-hover);
  --btn-bg-active: var(--btn-default-bg-active);
  --btn-text: var(--btn-default-text);
  --glow-color: var(--btn-default-border-hover);

  @include control-glow-tokens;

  min-height: calc(var(--control-height-ratio) * 1em);
  padding: 0.3em 1.1em;
  border: var(--border-width-base) solid var(--btn-border);

  font-size: inherit;
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
  color: var(--btn-text);
  text-decoration: none;
  letter-spacing: var(--tracking-wide);

  background-color: var(--btn-bg);
  box-shadow: var(--surface-rim-highlight), var(--shadow-elevation-sm);

  transition: var(--transition-interactive);

  @include state-interactive;

  &:hover {
    border-color: var(--btn-border-hover);
    background-color: var(--btn-bg-hover);
    box-shadow: var(--surface-rim-highlight-hover), var(--shadow-glow-hover);
  }

  &:focus-visible {
    border-color: var(--btn-border-hover);
    outline: none;
    box-shadow: var(--shadow-glow-focus);
  }

  &:active {
    transform: scale(0.98);
    border-color: var(--btn-border-hover);
    background-color: var(--btn-bg-active);
    box-shadow: var(--shadow-glow-active);
  }

  &--danger {
    --btn-bg: var(--btn-danger-bg);
    --btn-border: var(--btn-danger-border);
    --btn-border-hover: var(--btn-danger-border-hover);
    --btn-bg-hover: var(--btn-danger-bg-hover);
    --btn-bg-active: var(--btn-danger-bg-active);
    --btn-text: var(--btn-danger-text);
    --glow-color: var(--color-status-danger);
  }

  &--success {
    --btn-bg: var(--btn-success-bg);
    --btn-border: var(--btn-success-border);
    --btn-border-hover: var(--btn-success-border-hover);
    --btn-bg-hover: var(--btn-success-bg-hover);
    --btn-bg-active: var(--btn-success-bg-active);
    --btn-text: var(--btn-success-text);
    --glow-color: var(--color-status-success);
  }

  // アイコンボタン（正方形）
  &--icon {
    aspect-ratio: 1;
    padding: 0;
  }

  .btn-content {
    transition: opacity var(--duration-fast) var(--ease-base);
  }

  &.is-loading .btn-content {
    opacity: 0;
  }

  @include state-loading;
  @include state-disabled;
}
</style>
