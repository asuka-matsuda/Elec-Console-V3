<script setup lang="ts">
/**
 * AtomsCheckbox
 * [Atoms] 真偽値の選択や複数項目の選択を提供するチェックボックスコンポーネント
 */
import { computed, useAttrs } from 'vue'

import type { AtomsCheckboxProps } from '~/types/components'

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
} = defineProps<AtomsCheckboxProps>()

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
    class="relative inline-flex items-center gap-2 checkbox"
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
        class="absolute inset-0 m-0 w-full h-full opacity-0 checkbox-input"
        :value="value"
        :disabled="disabled"
        :true-value="trueValue"
        :false-value="falseValue"
        .indeterminate="indeterminate"
      >
      <span class="pointer-events-none relative w-full h-full checkbox-box">
        <AtomsIcon name="check" class="absolute top-1/2 left-1/2 icon is-check" />
        <AtomsIcon name="minus" class="absolute top-1/2 left-1/2 icon is-dash" />
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
      &:hover ~ .checkbox-box {
        border-color: var(--control-color);
        box-shadow: var(--shadow-glow-hover);
      }

      &:active ~ .checkbox-box {
        border-color: var(--control-color);
        box-shadow: var(--shadow-glow-active);
      }

      &:focus-visible ~ .checkbox-box {
        border-color: var(--control-color);
        outline: none;
        box-shadow: var(--shadow-glow-focus);
      }

      &:is(:checked, :indeterminate) ~ .checkbox-box {
        border-color: var(--control-color);
        background-color: var(--control-color);
        box-shadow: var(--shadow-glow-active);

        .icon {
          color: var(--control-icon);
        }
      }
    }

    &:checked ~ .checkbox-box .is-check,
    &:indeterminate ~ .checkbox-box .is-dash {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;

      :deep(:is(path, polyline, line)) {
        stroke-dashoffset: 0;
      }
    }
  }

  &.is-indeterminate .checkbox-box {
    border-color: var(--control-color);
    background-color: var(--control-color);
    box-shadow: var(--shadow-glow-active);

    .icon {
      color: var(--control-icon);
    }

    .is-dash {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;

      :deep(:is(path, polyline, line)) {
        stroke-dashoffset: 0;
      }
    }
  }

  &-box {
    border: var(--border-width-base) solid var(--color-border);
    border-radius: var(--radius-sm);
    background-color: var(--surface-bg-elevated);
    transition: var(--transition-interactive);

    .icon {
      pointer-events: none;

      transform: translate(-50%, -50%) scale(0.6);

      width: 75%;
      height: 75%;

      color: var(--control-icon);

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
