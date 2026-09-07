<script setup lang="ts">
/**
 * AppRadioGroup
 * 複数の選択肢から1つを選択するための、セグメントコントロール風のラジオボタングループコンポーネント。
 */
import { computed, useId } from 'vue'

import type { RadioOption } from '~/types/components'

const model = defineModel<string | number | boolean>()

const props = defineProps<{
  options: RadioOption[]
  name?: string
}>()

const uniqueName = useId()
const groupName = computed(() => props.name || `radio-group-${uniqueName}`)
</script>

<template>
  <div class="c-segmented-control">
    <label
      v-for="option in options"
      :key="String(option.value)"
      class="c-segmented-control__item"
      :style="option.color ? { '--radio-color': option.color } : undefined"
    >
      <input
        v-model="model"
        type="radio"
        :name="groupName"
        :value="option.value"
        :disabled="option.disabled"
        class="c-segmented-control__input"
      />
      {{ option.label }}
    </label>
  </div>
</template>

<style scoped lang="scss">
.c-segmented-control {
  --radio-color: var(--theme-accent);

  display: inline-flex;
  flex-shrink: 0;
  gap: var(--space-0-5);

  width: max-content;
  padding: var(--space-0-5);
  border: var(--border-width-base) solid var(--color-border);
  border-radius: var(--radius-sm);

  box-shadow: none;

  &__input {
    pointer-events: none;

    position: absolute;

    width: 0;
    height: 0;

    opacity: 0;
  }

  &__item {
    cursor: pointer;
    user-select: none;

    position: relative;
    z-index: 1;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    padding: var(--space-1) var(--space-3);
    border: var(--border-width-base) solid transparent;
    border-radius: var(--radius-sm);

    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-base);
    color: var(--color-text-muted);

    transition: var(--transition-base);

    &:not(:has(:disabled)) {
      &:hover:not(:has(:checked)) {
        border-color: var(--color-border);
        color: var(--color-text-main);
        box-shadow:
          0 0 4px color-mix(in srgb, var(--color-border) 45%, transparent),
          0 0 8px color-mix(in srgb, var(--color-border) 20%, transparent);
        transition: var(--transition-glow);
      }

      &:has(:focus-visible) {
        border-color: color-mix(in srgb, var(--radio-color) 60%, transparent);

        text-shadow: 0 0 var(--blur-md) color-mix(in srgb, var(--radio-color) 60%, transparent);

        outline: none;
        box-shadow:
          0 0 0 1px color-mix(in srgb, var(--radio-color) 70%, transparent),
          0 0 6px color-mix(in srgb, var(--radio-color) 50%, transparent),
          0 0 12px color-mix(in srgb, var(--radio-color) 20%, transparent);

        transition: var(--transition-glow);
      }
    }

    &:has(:checked) {
      border-color: var(--radio-color);

      color: var(--radio-color);
      text-shadow: 0 0 var(--blur-md) color-mix(in srgb, var(--radio-color) 60%, transparent);

      box-shadow:
        0 0 4px color-mix(in srgb, var(--radio-color) 60%, transparent),
        0 0 8px color-mix(in srgb, var(--radio-color) 30%, transparent),
        inset 0 0 2px color-mix(in srgb, var(--radio-color) 40%, transparent);

      transition: var(--transition-glow);
    }

    &:has(:disabled) {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }
}
</style>
