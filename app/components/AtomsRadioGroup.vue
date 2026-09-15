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
  box-shadow: none;

  .item {
    cursor: pointer;
    user-select: none;

    padding: 0.3em 0.8em;
    border: var(--border-width-base) solid transparent;
    border-radius: var(--radius-sm);

    font-size: inherit;
    font-weight: var(--font-weight-bold);
    color: var(--color-text-muted);

    transition: var(--transition-interactive);

    &:not(.is-disabled) {
      &:hover:not(.is-active) {
        border-color: var(--color-border);
        color: var(--color-text-main);
        background-color: var(--color-bg-hover);
      }

      &:focus-within {
        --glow-color: var(--radio-color);

        border-color: color-mix(in srgb, var(--radio-color) 60%, transparent);

        color: var(--radio-color);
        text-shadow: var(--text-glow-md);

        outline: none;
        box-shadow: var(--shadow-glow-focus);
      }
    }

    &.is-active {
      --glow-color: var(--radio-color);

      border-color: var(--radio-color);
      color: var(--radio-color);
      text-shadow: var(--text-glow-md);
      box-shadow: var(--shadow-glow-active);
    }

    &.is-disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }
}
</style>
