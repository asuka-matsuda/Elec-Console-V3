<script setup lang="ts">
/**
 * Input
 * 1行テキスト／数値入力コンポーネント。
 */
import { computed, ref, useId } from 'vue'

import type { InputProps } from '~/types/components'

const [model, modifiers] = defineModel<string | number | null>({
  set(value) {
    if (modifiers.number || type === 'number') {
      if (value === '' || value === null || value === undefined) return null

      const n = Number(value)

      return isNaN(n) ? value : n
    }

    return value
  },
})

const {
  id,
  name,
  type = 'text',
  placeholder,
  disabled = false,
  readonly = false,
  error = false,
  min,
  max,
  step,
  inputmode,
  autocomplete,
  maxlength,
  title,
} = defineProps<InputProps>()

const emit = defineEmits<{
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
  change: [event: Event]
}>()

const defaultId = useId()
const inputId = computed(() => id || defaultId)

const inputRef = ref<HTMLInputElement | null>(null)

defineExpose({
  /** input 要素へのフォーカス */
  focus: (options?: FocusOptions) => inputRef.value?.focus(options),
  /** input 要素のフォーカス解除 */
  blur: () => inputRef.value?.blur(),
  /** 入力テキストの全選択 */
  select: () => inputRef.value?.select(),
  /** input DOM 要素本体 */
  inputRef,
})
</script>

<template>
  <input
    :id="inputId"
    ref="inputRef"
    v-model="model"
    :type="type"
    :name="name"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :min="min"
    :max="max"
    :step="step"
    :inputmode="inputmode"
    :autocomplete="autocomplete"
    :maxlength="maxlength"
    :title="title"
    class="form-control"
    :class="{
      'is-error': error,
      'is-disabled': disabled,
      'is-readonly': readonly,
    }"
    @blur="emit('blur', $event)"
    @focus="emit('focus', $event)"
    @change="emit('change', $event)"
  />
</template>

<style scoped lang="scss">
.form-control {
  --glow-color: var(--theme-accent, var(--color-category-main));

  @include control-glow-tokens;

  width: 100%;
  min-width: 0;
  min-height: calc(var(--control-height-ratio) * 1em);
  padding-block: 0.3em;
  padding-inline: 1.2em;
  border: var(--border-width-base) solid var(--color-border);

  font-family: inherit;
  font-size: inherit;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-main);

  background-color: var(--surface-bg-elevated);
  outline: none;
  box-shadow: var(--shadow-sink);

  transition: var(--transition-interactive);

  &::placeholder {
    color: color-mix(in srgb, var(--color-text-muted) 50%, transparent);
    opacity: 1;
  }

  &::-webkit-search-cancel-button {
    appearance: none;
  }

  &.is-error {
    --glow-color: var(--color-status-danger);

    border-color: color-mix(in srgb, var(--glow-color) 60%, transparent);
  }

  &:hover {
    border-color: var(--glow-color);
    box-shadow: var(--shadow-glow-hover);
  }

  &:active {
    border-color: var(--glow-color);
    box-shadow: var(--shadow-glow-active);
  }

  &:focus,
  &:focus-visible {
    border-color: color-mix(in srgb, var(--glow-color) 70%, transparent);
    outline: none;
    box-shadow: var(--shadow-glow-focus);
  }

  &:is(:read-only, .is-readonly) {
    cursor: default;
    border-style: dashed;
    opacity: 0.85;
  }

  @include state-disabled;
}
</style>
