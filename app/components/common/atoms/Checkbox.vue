<script setup lang="ts">
/**
 * Checkbox
 * [Atoms] 真偽値の選択および複数選択（配列）を提供する最小チェックボックスコンポーネント
 */
import { computed } from 'vue'

import type { CheckboxProps } from '~/types/components'

const model = defineModel<unknown>()

const {
  value,
  label,
  disabled = false,
  variant = 'default',
  color,
} = defineProps<CheckboxProps>()

const customStyle = computed(() => {
  if (color) {
    return { '--control-checked-bg': color }
  }
  if (variant === 'success') {
    return { '--control-checked-bg': 'var(--color-status-success)' }
  }

  return undefined
})
</script>

<template>
  <label
    class="relative inline-flex items-center gap-item-gap checkbox"
    :class="[
      `checkbox--${variant}`,
      { 'is-disabled': disabled },
    ]"
    :style="customStyle"
  >
    <input
      v-model="model"
      type="checkbox"
      :value="value"
      :disabled="disabled"
    >
    <span class="grid shrink-0 place-items-center box">
      <Icon name="check" class="icon" />
    </span>

    <span v-if="label || $slots.default" class="label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped lang="scss">
.checkbox {
  --control-checked-bg: var(--theme-accent);

  font-size: inherit;
  color: var(--color-text-main);
  letter-spacing: var(--tracking-normal);

  @include state-interactive;

  input {
    pointer-events: none;

    position: absolute;

    width: 0;
    height: 0;

    opacity: 0;

    &:not(:disabled) {
      &:hover ~ .box {
        border-color: var(--control-checked-bg);
        box-shadow: var(--shadow-glow-hover);
      }

      &:focus-visible ~ .box {
        border-color: var(--control-checked-bg);
        box-shadow: var(--shadow-glow-focus);
      }

      &:active ~ .box {
        box-shadow: var(--shadow-glow-active);
      }

      &:checked ~ .box {
        box-shadow: var(--shadow-glow-active);
      }
    }

    &:checked ~ .box {
      border-color: var(--control-checked-bg);
      background-color: var(--control-checked-bg);

      .icon {
        transform: scale(1);
        opacity: 1;
      }
    }
  }

  .box {
    width: 1.25em;
    height: 1.25em;
    border: var(--border-width-base) solid var(--color-border);

    background-color: var(--surface-bg-elevated);

    transition: var(--transition-interactive);
  }

  .icon {
    transform: scale(0.4);

    grid-area: 1 / 1;

    width: 1em;
    height: 1em;

    color: var(--control-checked-icon);

    opacity: 0;

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
