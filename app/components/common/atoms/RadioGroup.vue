<script setup lang="ts" generic="T extends string | number | boolean = string | number | boolean">
/**
 * RadioGroup
 * 選択肢から1つを選択するボタングループ。
 */
import type { RadioGroupProps, RadioOption } from '~/types/components'

const model = defineModel<T>()

defineProps<RadioGroupProps<T>>()

defineSlots<{
  option?: (props: { option: RadioOption<T>, isActive: boolean }) => unknown
}>()
</script>

<template>
  <div
    class="radio-group shrink-0 gap-0.5 p-0.5"
    :class="block ? 'flex w-full' : 'inline-flex w-fit'"
  >
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      class="item inline-flex items-center justify-center"
      :class="{
        'is-active': model === option.value,
        'is-disabled': disabled || option.disabled,
        'flex-1': block,
      }"
      :disabled="disabled || option.disabled"
      :style="option.color ? { '--radio-color': option.color } : undefined"
      @click="model = option.value"
    >
      <slot name="option" :option="option" :is-active="model === option.value">
        {{ option.label }}
      </slot>
    </button>
  </div>
</template>

<style scoped lang="scss">
.radio-group {
  --radio-color: var(--theme-accent);

  border: var(--border-width-base) solid var(--color-border);
  background-color: var(--surface-bg-elevated);
  box-shadow: var(--shadow-sink);

  .item {
    padding: 0.3em 0.8em;
    border: var(--border-width-base) solid transparent;

    font-size: inherit;
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);

    background-color: transparent;

    transition: var(--transition-interactive);

    @include state-interactive;

    &:hover:not(.is-active) {
      color: var(--color-text-main);
      background-color: var(--color-bg-hover);
    }

    &:focus-visible {
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
