<script setup lang="ts">
/**
 * Switch (Segmented Switch)
 * Vercel Geist デザインシステム準拠の排他的セグメントスイッチコンポーネント。
 * 同一サーフェス内における 2〜3 個の排他的な動作モード・表示ビューを切り替えます。
 *
 * 用途例:
 * - 電圧降下 ⇄ 導体断面積
 * - Source ⇄ Output
 * - 月表示 ⇄ 週表示
 *
 * ※単一機能の ON/OFF（真偽値）には <Toggle> を使用してください。
 */
import { computed } from 'vue'

import type { IconSize, SwitchOption, SwitchProps } from '~/types/components'

const props = withDefaults(defineProps<SwitchProps>(), {
  options: () => [],
  size: 'md',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  'change': [value: string | number]
}>()

const iconSize = computed<IconSize>(() => {
  return props.size === 'lg' ? 'md' : 'sm'
})

const handleSelect = (option: SwitchOption) => {
  if (props.disabled || option.disabled || option.value === props.modelValue) return
  emit('update:modelValue', option.value)
  emit('change', option.value)
}
</script>

<template>
  <nav class="switch inline-flex items-center" :class="[`switch--${size}`, { 'is-disabled': disabled }]">
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      type="button"
      class="switch-item inline-flex items-center justify-center gap-inline-gap"
      :class="{
        'is-active': modelValue === opt.value,
        'is-disabled': disabled || opt.disabled,
      }"
      :disabled="disabled || opt.disabled"
      @click="handleSelect(opt)"
    >
      <Icon v-if="opt.icon" :name="opt.icon" :size="iconSize" />
      <span>{{ opt.label }}</span>
    </button>
  </nav>
</template>

<style scoped lang="scss">
.switch {
  gap: var(--space-0-5);

  padding: var(--space-0-5);
  border: var(--border-width-base) solid var(--color-border);
  border-radius: 0;

  background-color: var(--surface-bg-sunken);
  box-shadow: var(--shadow-sink);

  &.is-disabled {
    @include state-disabled;
  }

  &--sm {
    .switch-item {
      padding: 0.25em 0.6em;
      font-size: var(--font-size-xs);
    }
  }

  &--md {
    .switch-item {
      padding: 0.35em 0.8em;
      font-size: var(--font-size-sm);
    }
  }

  &--lg {
    .switch-item {
      padding: 0.5em 1em;
      font-size: var(--font-size-base);
    }
  }
}

.switch-item {
  user-select: none;

  border: var(--border-width-base) solid transparent;
  border-radius: 0;

  font-weight: var(--font-weight-medium);
  line-height: var(--leading-tight);
  color: var(--color-text-muted);
  white-space: nowrap;

  background-color: transparent;

  transition: var(--transition-interactive);

  @include state-interactive;

  &:hover:not(.is-disabled) {
    color: var(--color-text-main);
    background-color: color-mix(in srgb, var(--color-text-main) 6%, transparent);
  }

  &.is-active {
    border-color: var(--theme-accent);

    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);

    background-color: var(--surface-bg-raised);
    box-shadow: var(--shadow-glow-active);
  }

  &.is-disabled {
    @include state-disabled;
  }
}
</style>
