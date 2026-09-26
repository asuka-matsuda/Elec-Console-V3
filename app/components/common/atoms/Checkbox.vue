<script setup lang="ts">
/**
 * Checkbox
 * [Atoms] 真偽値の選択や複数項目の選択を提供するチェックボックスコンポーネント
 */
import { computed, useAttrs } from 'vue'

import type { CheckboxProps } from '~/types/components'

defineOptions({
  inheritAttrs: false,
})

const model = defineModel<unknown>()

const {
  value,
  label,
  disabled = false,
  indeterminate = false,
  trueValue = true,
  falseValue = false,
} = defineProps<CheckboxProps>()

const attrs = useAttrs()

const rootAttrs = computed(() => {
  const { class: className, style } = attrs

  return { class: className, style }
})

const inputAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs

  return rest
})
</script>

<template>
  <label
    class="relative inline-flex items-center gap-item-gap checkbox"
    :class="[
      {
        'is-disabled': disabled,
        'is-indeterminate': indeterminate,
      },
      rootAttrs.class,
    ]"
    :style="rootAttrs.style"
  >
    <span class="relative flex shrink-0 items-center justify-center w-[1.4em] h-[1.4em]">
      <input
        v-model="model"
        v-bind="inputAttrs"
        type="checkbox"
        class="absolute inset-0 m-0 opacity-0 checkbox-input"
        :value="value"
        :disabled="disabled"
        :true-value="trueValue"
        :false-value="falseValue"
        .indeterminate="indeterminate"
      >
      <span class="checkbox-box">
        <Icon name="check" class="icon is-check" />
        <Icon name="minus" class="icon is-dash" />
      </span>
    </span>

    <span v-if="label || $slots.default" class="label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped lang="scss">
.checkbox {
  --control-color: var(--theme-accent);
  --control-icon: var(--color-text-on-emphasis);

  cursor: pointer;
  user-select: none;
  color: var(--color-text-main);
  letter-spacing: var(--tracking-normal);

  &-input {
    cursor: inherit;

    &:not(:disabled) {
      &:is(:hover, :active, :focus-visible, :checked, :indeterminate) ~ .checkbox-box {
        border-color: var(--control-color);
      }

      &:hover ~ .checkbox-box {
        box-shadow: var(--shadow-glow-hover);
      }

      &:active ~ .checkbox-box {
        box-shadow: var(--shadow-glow-active);
      }

      &:focus-visible ~ .checkbox-box {
        outline: none;
        box-shadow: var(--shadow-glow-focus);
      }

      &:is(:checked, :indeterminate) ~ .checkbox-box,
      .checkbox.is-indeterminate & ~ .checkbox-box {
        border-color: var(--control-color);
        background-color: var(--control-color);
        box-shadow: var(--shadow-glow-active);

        .icon {
          color: var(--control-icon);
        }
      }
    }

    &:checked ~ .checkbox-box .is-check,
    &:indeterminate ~ .checkbox-box .is-dash,
    .checkbox.is-indeterminate & ~ .checkbox-box .is-dash {
      transform: scale(1);
      opacity: 1;

      :deep(:is(path, polyline, line)) {
        stroke-dashoffset: 0;
      }
    }
  }

  &-box {
    pointer-events: none;

    position: relative;

    display: grid;
    place-items: center;

    width: 100%;
    height: 100%;
    border: var(--border-width-base) solid var(--color-border);

    background-color: var(--surface-bg-elevated);

    transition: var(--transition-interactive);

    .icon {
      transform: scale(0.6);

      grid-area: 1 / 1;

      width: 75%;
      height: 75%;

      opacity: 0;

      transition: var(--transition-base);

      :deep(svg) {
        stroke-linecap: square;
        stroke-linejoin: miter;
        stroke-width: 3;
      }

      :deep(:is(path, polyline, line)) {
        stroke-dasharray: 24;
        stroke-dashoffset: 24;
        transition: stroke-dashoffset var(--duration-base) var(--ease-base);
      }
    }
  }

  .label {
    user-select: text;
    transition: var(--transition-interactive);
  }

  @include state-disabled;
}
</style>
