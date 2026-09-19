<script setup lang="ts" generic="T extends string | number | boolean = string | number | boolean">
/**
 * RadioGroup
 * [Atoms] 複数の選択肢から1つを選択するための、セグメントコントロール風の押しボタン型ラジオボタングループ。
 * フォーム入力パラメータ、ステータス選択、一覧フィルター専用。
 */
import { computed, useId } from 'vue'

import type { RadioGroupProps, RadioOption } from '~/types/components'

const model = defineModel<T>()

const props = withDefaults(
  defineProps<RadioGroupProps<T>>(),
  {
    name: undefined,
    disabled: false,
    block: false,
  },
)

const emit = defineEmits<{
  (e: 'change', value: T): void
}>()

defineSlots<{
  option?: (props: { option: RadioOption<T>, isSelected: boolean }) => unknown
}>()

const uniqueName = useId()
const groupName = computed(() => props.name || `radio-group-${uniqueName}`)

const isSelected = (value: T) => model.value === value
const isOptionDisabled = (option: RadioOption<T>) => props.disabled || Boolean(option.disabled)

const updateValue = (value: T) => {
  model.value = value
  emit('change', value)
}
</script>

<template>
  <div
    class="radio-group inline-flex shrink-0 gap-0.5 p-0.5"
    :class="{
      'w-fit': !block,
      'radio-group--block w-full flex': block,
    }"
  >
    <label
      v-for="option in options"
      :key="String(option.value)"
      class="inline-flex items-center justify-center item"
      :class="{
        'is-active': isSelected(option.value),
        'is-disabled': isOptionDisabled(option),
        'flex-1 text-center': block,
      }"
      :style="option.color ? { '--radio-color': option.color } : undefined"
    >
      <input
        type="radio"
        :name="groupName"
        :value="option.value"
        :checked="isSelected(option.value)"
        :disabled="isOptionDisabled(option)"
        class="radio-native-input"
        @change="updateValue(option.value)"
      />
      <slot name="option" :option="option" :is-selected="isSelected(option.value)">
        {{ option.label }}
      </slot>
    </label>
  </div>
</template>

<style scoped lang="scss">
.radio-group {
  --radio-color: var(--theme-accent);

  border: var(--border-width-base) solid var(--color-border);

  font-size: inherit;

  background-color: var(--surface-bg-elevated);
  box-shadow: var(--shadow-sink);

  transition: var(--transition-interactive);

  .radio-native-input {
    pointer-events: none;

    position: absolute;

    width: 0;
    height: 0;

    opacity: 0;
  }

  .item {
    cursor: pointer;
    user-select: none;

    padding: 0.3em 0.8em;
    border: var(--border-width-base) solid transparent;

    font-size: inherit;
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);

    transition: var(--transition-interactive);

    &:hover:not(.is-disabled, .is-active) {
      color: var(--color-text-main);
      background-color: var(--color-bg-hover);
    }

    &:has(.radio-native-input:focus-visible) {
      outline: none;
      box-shadow: var(--shadow-glow-focus);
    }

    &.is-active {
      border-color: color-mix(in srgb, var(--radio-color) 70%, var(--color-border));

      font-weight: var(--font-weight-semibold);
      color: var(--color-text-main);

      background-color: var(--surface-bg-solid);
      box-shadow: var(--shadow-elevation-sm);
    }

    @include state-disabled;
  }
}
</style>
