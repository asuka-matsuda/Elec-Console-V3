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
  variant = 'secondary',
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
        'btn--icon-only': isIconOnly,
        'is-loading': loading,
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
  // デフォルト変数: Secondary (GitHub Primer Default Button)
  --btn-bg: var(--btn-secondary-bg);
  --btn-bg-hover: var(--btn-secondary-bg-hover);
  --btn-bg-active: var(--btn-secondary-bg-active);
  --btn-border: var(--btn-secondary-border);
  --btn-border-hover: var(--btn-secondary-border-hover);
  --btn-text: var(--btn-secondary-text);
  --btn-text-hover: var(--btn-secondary-text);
  --glow-color: var(--color-border);

  cursor: pointer;
  user-select: none;

  min-height: 2.4em;
  padding-block: 0.3em;
  padding-inline: 1.1em;
  border: var(--border-width-base) solid var(--btn-border);
  border-radius: var(--radius-sm);

  font-size: inherit;
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
  color: var(--btn-text);
  text-decoration: none;
  letter-spacing: var(--tracking-wide);

  background-color: var(--btn-bg);
  box-shadow: var(--shadow-elevation-sm);

  transition: var(--transition-interactive);

  @include state-control-interactive {
    &:hover {
      border-color: var(--btn-border-hover);
      color: var(--btn-text-hover);
      background-color: var(--btn-bg-hover);
      box-shadow: var(--shadow-glow-hover);
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
  }

  :deep(.icon) {
    width: 1.15em;
    height: 1.15em;
  }

  // Primary: 明示的に指定された場合のみ、ソリッドベタ塗りの主CTAとして目立たせる
  &--primary {
    --btn-bg: var(--btn-primary-bg);
    --btn-bg-hover: var(--btn-primary-bg-hover);
    --btn-bg-active: var(--btn-primary-bg-active);
    --btn-border: var(--btn-primary-border);
    --btn-border-hover: var(--btn-primary-border-hover);
    --btn-text: var(--btn-primary-text);
    --btn-text-hover: var(--btn-primary-text);
    --glow-color: var(--btn-primary-bg);

    font-weight: var(--font-weight-semibold);
  }

  // Secondary: 標準ボタン
  &--secondary {
    --btn-bg: var(--btn-secondary-bg);
    --btn-bg-hover: var(--btn-secondary-bg-hover);
    --btn-bg-active: var(--btn-secondary-bg-active);
    --btn-border: var(--btn-secondary-border);
    --btn-border-hover: var(--btn-secondary-border-hover);
    --btn-text: var(--btn-secondary-text);
    --btn-text-hover: var(--btn-secondary-text);
    --glow-color: var(--color-border);
  }

  // Ghost: ヘッダーメニューやクローズボタンなど枠・背景なしのアイコンボタン
  &--ghost {
    --btn-bg: transparent;
    --btn-bg-hover: var(--color-bg-hover);
    --btn-bg-active: color-mix(in srgb, var(--color-overlay) 10%, transparent);
    --btn-border: transparent;
    --btn-border-hover: transparent;
    --btn-text: var(--color-text-secondary);
    --btn-text-hover: var(--color-text-main);
    --glow-color: var(--color-border);

    box-shadow: none;
  }

  // Danger: Primer仕様。通常時は控えめな枠線＋赤文字、ホバー時に警告として赤ベタ塗り
  &--danger {
    --btn-bg: var(--btn-secondary-bg);
    --btn-bg-hover: var(--btn-danger-bg);
    --btn-bg-active: var(--btn-danger-bg-active);
    --btn-border: var(--color-border);
    --btn-border-hover: var(--btn-danger-border);
    --btn-text: var(--color-status-danger);
    --btn-text-hover: var(--btn-danger-text);
    --glow-color: var(--btn-danger-bg);
  }

  &--success {
    --btn-bg: var(--btn-secondary-bg);
    --btn-bg-hover: var(--btn-success-bg);
    --btn-bg-active: var(--btn-success-bg-active);
    --btn-border: var(--color-border);
    --btn-border-hover: var(--btn-success-border);
    --btn-text: var(--color-status-success);
    --btn-text-hover: var(--btn-success-text);
    --glow-color: var(--btn-success-bg);
  }

  &--icon-only {
    aspect-ratio: 1;
    width: 2.4em;
    min-height: 2.4em;
    padding: 0;
  }

  @include state-loading;
  @include state-disabled;
}
</style>
