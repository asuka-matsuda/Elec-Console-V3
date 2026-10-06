<script setup lang="ts">
/**
 * Radio
 * Geist デザインシステム準拠のラジオボタンコンポーネント（Atoms）。
 * フォーム内における排他的な単一項目選択を提供します。
 */
import { computed, useId } from 'vue'

import type { RadioProps } from '~/types/components'

const model = defineModel<unknown>()

const props = withDefaults(defineProps<RadioProps>(), {
  disabled: false,
  error: false,
})

const emit = defineEmits<{
  change: [value: unknown]
}>()

const defaultId = useId()
const radioId = computed(() => props.id || defaultId)
const isChecked = computed(() => model.value !== undefined && model.value === props.value)

const handleChange = () => {
  if (props.disabled) return
  model.value = props.value
  emit('change', props.value)
}

const customStyle = computed(() => {
  if (props.color) {
    return { '--control-checked-bg': props.color }
  }

  return undefined
})
</script>

<template>
  <label
    class="relative inline-flex items-center gap-item-gap radio"
    :class="{
      'is-checked': isChecked,
      'is-disabled': disabled,
      'is-error': error,
    }"
    :style="customStyle"
    :title="title"
  >
    <input
      :id="radioId"
      type="radio"
      :name="name"
      :value="value"
      :checked="isChecked"
      :disabled="disabled"
      @change="handleChange"
    >
    <span class="grid shrink-0 place-items-center circle">
      <span class="dot" />
    </span>
    <span v-if="label || $slots.default" class="label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped lang="scss">
.radio {
  --control-checked-bg: var(--theme-accent);
  --glow-color: var(--theme-accent, var(--color-category-main));

  @include control-glow-tokens;

  font-size: inherit;
  color: var(--color-text-main);
  letter-spacing: var(--tracking-normal);

  @include state-interactive;

  &.is-error {
    --glow-color: var(--color-status-danger);
    --control-checked-bg: var(--color-status-danger);

    .circle {
      border-color: color-mix(in srgb, var(--glow-color) 60%, transparent);
    }
  }

  &:hover:not(.is-disabled) .circle {
    border-color: var(--control-checked-bg);
    box-shadow: var(--shadow-glow-hover);
  }

  input {
    pointer-events: none;

    position: absolute;

    width: 0;
    height: 0;

    opacity: 0;

    &:focus-visible ~ .circle {
      border-color: var(--control-checked-bg);
      box-shadow: var(--shadow-glow-focus);
    }

    &:active ~ .circle {
      box-shadow: var(--shadow-glow-active);
    }
  }

  .circle {
    width: 1.125rem;
    height: 1.125rem;
    border: var(--border-width-base) solid var(--color-border);
    border-radius: var(--radius-circle);

    background-color: var(--surface-bg-elevated);

    transition: var(--transition-interactive);
  }

  &.is-checked .circle {
    border-color: var(--control-checked-bg);
    box-shadow: var(--shadow-glow-active);

    .dot {
      transform: scale(1);
      opacity: 1;
    }
  }

  .dot {
    transform: scale(0);

    width: 0.5rem;
    height: 0.5rem;
    border-radius: var(--radius-circle);

    opacity: 0;
    background-color: var(--control-checked-bg);

    transition:
      transform var(--duration-fast) var(--ease-spring),
      opacity var(--duration-fast) var(--ease-base);
  }

  .label {
    user-select: text;
  }

  @include state-disabled;
}
</style>
