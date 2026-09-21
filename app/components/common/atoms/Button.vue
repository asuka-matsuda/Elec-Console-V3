<script setup lang="ts">
/**
 * Button
 * [Atoms] 汎用的なボタン・リンクボタンコンポーネント（最小パーツ）
 * - to/href 指定時は NuxtLink、未指定時は button をポリモーフィックに描画
 * - disabled/loading 時は安全な button フォールバックを実行
 */
import { computed, useSlots } from 'vue'

import { NuxtLink } from '#components'
import type { ButtonProps } from '~/types/components'

const {
  to,
  href,
  type = 'button',
  variant = 'default',
  disabled = false,
  loading = false,
  icon,
  iconRight,
  iconOnly = false,
  block = false,
  title,
} = defineProps<ButtonProps>()

const slots = useSlots()
const target = computed(() => to || href)
const isClickable = computed(() => !disabled && !loading)
const isIconOnly = computed(() => iconOnly || ((Boolean(icon) || Boolean(iconRight)) && !slots.default))

// レンダリングする要素の決定（無効化時は <a> ではなくクリック不能な <button> に落とす）
const isLink = computed(() => Boolean(target.value) && isClickable.value)
const componentTag = computed(() => (isLink.value ? NuxtLink : 'button'))

// button 要素時の type 決定（未指定時のブラウザデフォルト submit 扱いを防止）
const computedType = computed(() => {
  if (isLink.value) return undefined

  return type || 'button'
})
</script>

<template>
  <component
    :is="componentTag"
    :to="isLink ? target : undefined"
    :type="computedType"
    :disabled="!isClickable ? true : undefined"
    :title="title"
    class="inline-flex shrink-0 items-center justify-center gap-[0.5em] btn"
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

    <Icon v-if="loading" name="loader" spin />
    <Icon v-else-if="icon" :name="icon" />

    <slot />

    <Icon v-if="iconRight && !loading" :name="iconRight" />
  </component>
</template>

<style scoped lang="scss">
.btn {
  // デフォルト変数: Default Button
  --btn-bg: var(--btn-default-bg);
  --btn-bg-hover: var(--btn-default-bg-hover);
  --btn-bg-active: var(--btn-default-bg-active);
  --btn-border: var(--btn-default-border);
  --btn-border-hover: var(--btn-default-border-hover);
  --btn-text: var(--btn-default-text);
  --btn-text-hover: var(--btn-default-text);
  --glow-color: var(--color-border);

  cursor: pointer;
  user-select: none;

  min-height: 2.4em;
  padding-block: 0.3em;
  padding-inline: 1.1em;
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

  @include state-control-interactive {
    &:hover {
      border-color: var(--btn-border-hover);
      color: var(--btn-text-hover);
      background:
        linear-gradient(
          to bottom,
          color-mix(in srgb, var(--color-overlay) 6%, transparent) 0%,
          transparent 100%
        ),
        var(--btn-bg-hover);
      box-shadow:
        var(--surface-rim-highlight-hover),
        var(--shadow-glow-hover);
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
      box-shadow:
        inset 0 1px 2px color-mix(in srgb, black 30%, transparent),
        var(--shadow-glow-active);
    }
  }

  // Danger: 危険・削除アクション（ホバー時に50%ティント背景＋赤文字維持）
  &--danger {
    --btn-bg: var(--btn-danger-bg);
    --btn-bg-hover: var(--btn-danger-bg-hover);
    --btn-bg-active: var(--btn-danger-bg-active);
    --btn-border: var(--btn-danger-border);
    --btn-border-hover: var(--btn-danger-border-hover);
    --btn-text: var(--btn-danger-text);
    --btn-text-hover: var(--btn-danger-text-hover);
    --glow-color: var(--color-status-danger);
  }

  // Success: 保存・確定・主アクション（ホバー時に50%ティント背景＋緑文字維持）
  &--success {
    --btn-bg: var(--btn-success-bg);
    --btn-bg-hover: var(--btn-success-bg-hover);
    --btn-bg-active: var(--btn-success-bg-active);
    --btn-border: var(--btn-success-border);
    --btn-border-hover: var(--btn-success-border-hover);
    --btn-text: var(--btn-success-text);
    --btn-text-hover: var(--btn-success-text-hover);
    --glow-color: var(--color-status-success);
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
