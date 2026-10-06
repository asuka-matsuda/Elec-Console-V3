<script setup lang="ts">
/**
 * Button
 * 汎用ボタンコンポーネント (Vercel Geist デザインシステム準拠)
 * - to 指定時は NuxtLink、未指定時は button 要素を描画
 * - size に応じてフォントサイズ、高さ、パディング、アイコンサイズを自動同期拘束
 */
import { computed, useSlots } from 'vue'

import { NuxtLink } from '#components'
import type { ButtonProps } from '~/types/components'

const {
  to,
  type = 'button',
  variant = 'secondary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  suffixIcon,
  block = false,
} = defineProps<ButtonProps>()

const slots = useSlots()
const isLink = computed(() => Boolean(to) && !disabled && !loading)
const isIconButton = computed(() => Boolean(icon || suffixIcon) && !slots.default)

const computedIconSize = computed(() => {
  if (size === 'sm') return 'sm'
  if (size === 'lg') return 'lg'

  return 'md'
})

const computedSpinnerSize = computed(() => {
  if (size === 'sm') return 14
  if (size === 'lg') return 20

  return 16
})
</script>

<template>
  <component :is="isLink ? NuxtLink : 'button'" :to="isLink ? to : undefined" :type="isLink ? undefined : type" :disabled="!isLink && (disabled || loading)" class="relative inline-flex shrink-0 items-center justify-center btn" :class="[`btn--${variant}`, `btn--${size}`, { 'btn--icon': isIconButton, 'btn--block': block, 'is-loading': loading }]">
    <span class="inline-flex items-center justify-center btn-content">
      <Icon v-if="icon" :name="icon" :size="computedIconSize" />
      <slot />
      <Icon v-if="suffixIcon" :name="suffixIcon" :size="computedIconSize" />
    </span>

    <span v-if="loading" class="absolute inset-0 flex items-center justify-center">
      <Spinner :size="computedSpinnerSize" />
    </span>
  </component>
</template>

<style scoped lang="scss">
.btn {
  // 基準デフォルト（secondary）
  --btn-bg: var(--btn-secondary-bg);
  --btn-border: var(--btn-secondary-border);
  --btn-border-hover: var(--btn-secondary-border-hover);
  --btn-bg-hover: var(--btn-secondary-bg-hover);
  --btn-bg-active: var(--btn-secondary-bg-active);
  --btn-text: var(--btn-secondary-text);
  --glow-color: var(--btn-secondary-border-hover);

  // サイズ変数（デフォルトは md）
  --btn-height: 40px;
  --btn-font-size: var(--font-size-sm);
  --btn-padding-x: var(--space-4);
  --btn-gap: var(--space-2);

  @include control-glow-tokens;

  user-select: none;

  height: var(--btn-height);
  min-height: var(--btn-height);
  padding: 0 var(--btn-padding-x);
  border: var(--border-width-base) solid var(--btn-border);
  border-radius: 0; // 直角規約

  font-size: var(--btn-font-size);
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

  // --- サイズ展開 (Geist 32px / 40px / 48px) ---
  &--sm {
    --btn-height: 32px;
    --btn-font-size: var(--font-size-xs);
    --btn-padding-x: var(--space-3);
    --btn-gap: var(--space-2);
  }

  &--md {
    --btn-height: 40px;
    --btn-font-size: var(--font-size-sm);
    --btn-padding-x: var(--space-4);
    --btn-gap: var(--space-2);
  }

  &--lg {
    --btn-height: 48px;
    --btn-font-size: var(--font-size-base);
    --btn-padding-x: var(--space-6);
    --btn-gap: var(--space-3);
  }

  // --- バリアント展開 ---
  // Primary (ブランドサーフェス発光型)
  &--primary {
    --btn-bg: var(--btn-primary-bg);
    --btn-border: var(--btn-primary-border);
    --btn-border-hover: var(--btn-primary-border-hover);
    --btn-bg-hover: var(--btn-primary-bg-hover);
    --btn-bg-active: var(--btn-primary-bg-active);
    --btn-text: var(--btn-primary-text);
    --glow-color: var(--btn-primary-border-hover);

    font-weight: var(--font-weight-semibold);
  }

  // Secondary (標準枠線ボタン)
  &--secondary {
    --btn-bg: var(--btn-secondary-bg);
    --btn-border: var(--btn-secondary-border);
    --btn-border-hover: var(--btn-secondary-border-hover);
    --btn-bg-hover: var(--btn-secondary-bg-hover);
    --btn-bg-active: var(--btn-secondary-bg-active);
    --btn-text: var(--btn-secondary-text);
    --glow-color: var(--btn-secondary-border-hover);
  }

  // Tertiary (ゴースト・枠線なし)
  &--tertiary {
    --btn-bg: transparent;
    --btn-border: transparent;
    --btn-border-hover: transparent;
    --btn-bg-hover: var(--color-bg-hover);
    --btn-bg-active: color-mix(in srgb, var(--color-overlay) 10%, transparent);
    --btn-text: var(--color-text-main);
    --glow-color: transparent;

    box-shadow: none;

    &:hover {
      box-shadow: none;
    }
  }

  // Danger (破壊的アクション)
  &--danger {
    --btn-bg: var(--btn-danger-bg);
    --btn-border: var(--btn-danger-border);
    --btn-border-hover: var(--btn-danger-border-hover);
    --btn-bg-hover: var(--btn-danger-bg-hover);
    --btn-bg-active: var(--btn-danger-bg-active);
    --btn-text: var(--btn-danger-text);
    --glow-color: var(--color-status-danger);
  }

  // Warning (警告アクション)
  &--warning {
    --btn-bg: var(--btn-warning-bg);
    --btn-border: var(--btn-warning-border);
    --btn-border-hover: var(--btn-warning-border-hover);
    --btn-bg-hover: var(--btn-warning-bg-hover);
    --btn-bg-active: var(--btn-warning-bg-active);
    --btn-text: var(--btn-warning-text);
    --glow-color: var(--color-status-warning);
  }

  // アイコンボタン（正方形）
  &--icon {
    aspect-ratio: 1;
    width: var(--btn-height);
    padding: 0;
  }

  // ブロック（全幅）
  &--block {
    display: flex;
    width: 100%;
  }

  .btn-content {
    gap: var(--btn-gap);
    transition: opacity var(--duration-fast) var(--ease-base);
  }

  &.is-loading .btn-content {
    opacity: 0;
  }

  @include state-loading;
  @include state-disabled;
}
</style>
