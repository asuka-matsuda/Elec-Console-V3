<script setup lang="ts">
/**
 * Checkbox
 * チェックボックスコンポーネント。
 */
import { computed, useId } from 'vue'

import type { CheckboxProps } from '~/types/components'

const model = defineModel<boolean | (string | number | boolean)[]>()

const {
  id,
  value,
  label,
  disabled = false,
  error = false,
  variant = 'default',
  color,
  title,
} = defineProps<CheckboxProps>()

const emit = defineEmits<{
  change: [value: boolean | (string | number | boolean)[] | undefined]
}>()

const defaultId = useId()
const checkboxId = computed(() => id || defaultId)

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
      {
        'is-disabled': disabled,
        'is-error': error,
      },
    ]"
    :style="customStyle"
    :title="title"
  >
    <input
      :id="checkboxId"
      v-model="model"
      type="checkbox"
      :value="value"
      :disabled="disabled"
      @change="emit('change', model)"
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
  --glow-color: var(--theme-accent, var(--color-category-main));

  font-size: inherit;
  color: var(--color-text-main);
  letter-spacing: var(--tracking-normal);

  @include state-interactive;
  @include control-glow-tokens;

  &.is-error {
    --glow-color: var(--color-status-danger);
    --control-checked-bg: var(--color-status-danger);

    .box {
      border-color: color-mix(in srgb, var(--glow-color) 60%, transparent);
    }
  }

  &:hover:not(.is-disabled) .box {
    border-color: var(--control-checked-bg);
    box-shadow: var(--shadow-glow-hover);
  }

  input {
    pointer-events: none;

    position: absolute;

    width: 0;
    height: 0;

    opacity: 0;

    &:focus-visible ~ .box {
      border-color: var(--control-checked-bg);
      box-shadow: var(--shadow-glow-focus);
    }

    &:active ~ .box {
      box-shadow: var(--shadow-glow-active);
    }

    &:checked ~ .box {
      border-color: var(--control-checked-bg);
      background-color: var(--control-checked-bg);
      box-shadow: var(--shadow-glow-active);

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
