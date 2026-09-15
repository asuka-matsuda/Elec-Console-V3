<script setup lang="ts" generic="T extends string | number | boolean = string | number | boolean">
/**
 * AtomsRadioGroup
 * [Atoms] 複数の選択肢から1つを選択するための、セグメントコントロール風のラジオボタングループコンポーネント。
 */
import { computed, useId } from 'vue'

import type { RadioOption } from '~/types/components'

const model = defineModel<T>()

const props = defineProps<{
  options: RadioOption<T>[]
  name?: string
}>()

const uniqueName = useId()
const groupName = computed(() => props.name || `radio-group-${uniqueName}`)

const isSelected = (value: T) => model.value === value

const updateValue = (value: T, disabled?: boolean) => {
  if (disabled) return
  model.value = value
}
</script>

<template>
  <div class="inline-flex shrink-0 w-max gap-0.5 p-0.5 radio-group">
    <label
      v-for="option in options"
      :key="String(option.value)"
      class="relative z-[1] inline-flex items-center justify-center item"
      :class="{
        'is-active': isSelected(option.value),
        'is-disabled': option.disabled,
      }"
      :style="option.color ? { '--radio-color': option.color } : undefined"
    >
      <input
        type="radio"
        :name="groupName"
        :value="option.value"
        :checked="isSelected(option.value)"
        :disabled="option.disabled"
        class="pointer-events-none absolute w-0 h-0 opacity-0"
        @change="updateValue(option.value, option.disabled)"
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
  border-radius: var(--radius-sm);
  background-color: var(--surface-bg-elevated);
  box-shadow: var(--shadow-sink);

  .item {
    cursor: pointer;
    user-select: none;

    padding: 0.3em 0.8em;
    border: var(--border-width-base) solid transparent;
    border-radius: var(--radius-sm);

    font-size: inherit;
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);

    transition: var(--transition-interactive);

    &:not(.is-disabled) {
      &:hover:not(.is-active) {
        color: var(--color-text-main);
        background-color: var(--color-bg-hover);
      }

      &:focus-within {
        outline: none;
        box-shadow: var(--shadow-glow-focus);
      }
    }

    &.is-active {
      border-color: var(--color-border);

      font-weight: var(--font-weight-semibold);
      color: var(--color-text-main);

      background-color: var(--surface-bg-solid);
      box-shadow: var(--shadow-elevation-sm);
    }

    @include state-disabled;
  }
}
</style>
