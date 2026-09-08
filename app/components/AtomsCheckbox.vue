<script setup lang="ts">
/**
 * AtomsCheckbox
 * [Atoms] 真偽値を選択するためのチェックボックスコンポーネント
 */
const model = defineModel<boolean | unknown[]>()

const {
  value,
  label,
  disabled = false,
  indeterminate = false,
} = defineProps<{
  value?: unknown
  label?: string
  disabled?: boolean
  indeterminate?: boolean
}>()
</script>

<template>
  <label class="relative inline-flex items-center gap-2 checkbox">
    <input
      v-model="model"
      type="checkbox"
      class="absolute inset-0 w-full h-full"
      .indeterminate="indeterminate"
      :value="value"
      :disabled="disabled"
    >
    <span class="relative flex shrink-0 items-center justify-center box">
      <AtomsIcon name="check" class="absolute top-1/2 left-1/2 icon is-check" />
      <AtomsIcon name="minus" class="absolute top-1/2 left-1/2 icon is-dash" />
    </span>
    <span v-if="label || $slots.default" class="label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped lang="scss">
.checkbox {
  --checkbox-color: var(--theme-accent);
  --glow-color: var(--checkbox-color);

  cursor: pointer;
  user-select: none;

  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  letter-spacing: var(--tracking-normal);

  &:has(:disabled) {
    cursor: not-allowed;
  }

  input {
    cursor: inherit;
    z-index: 1;
    opacity: 0;

    &:disabled {
      ~ .box,
      ~ .label {
        cursor: not-allowed;
        opacity: 0.5;
        filter: grayscale(100%);
      }
    }

    &:not(:disabled) {
      &:hover {
        ~ .label {
          --glow-color: var(--checkbox-color);

          color: color-mix(in srgb, var(--checkbox-color) 90%, transparent);
          text-shadow: var(--text-glow-sm);
        }

        &:not(:focus-visible, :active, :checked, :indeterminate) ~ .box {
          border-color: var(--checkbox-color);
          box-shadow: var(--shadow-glow-hover);
          transition: var(--transition-glow);
        }
      }

      &:active ~ .box {
        border-color: var(--checkbox-color);
        box-shadow: var(--shadow-glow-active);
        transition: var(--transition-glow);
      }

      &:focus-visible ~ .box {
        border-color: color-mix(in srgb, var(--checkbox-color) 60%, transparent);
        outline: none;
        box-shadow: var(--shadow-glow-focus);
        transition: var(--transition-glow);
      }

      &:is(:checked, :indeterminate) ~ .box {
        border-color: var(--checkbox-color);
        background-color: color-mix(in srgb, var(--checkbox-color) 15%, var(--surface-bg-elevated));
        box-shadow: var(--shadow-glow-active);
        transition: var(--transition-glow);

        .icon {
          filter: var(--drop-shadow-glow-sm);
        }
      }
    }

    &:checked ~ .box .is-check,
    &:indeterminate ~ .box .is-dash {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;

      :deep(:is(path, polyline, line)) {
        stroke-dashoffset: 0;
      }
    }
  }

  .box {
    z-index: 1;

    width: 1.4em;
    height: 1.4em;
    border: var(--border-width-base) solid var(--color-border);
    border-radius: var(--radius-sm);

    background-color: var(--surface-bg-elevated);

    transition: var(--transition-base);

    .icon {
      transform: translate(-50%, -50%) scale(0.6);

      width: 75%;
      height: 75%;

      color: var(--checkbox-color);

      opacity: 0;

      transition: opacity var(--duration-base) var(--ease-base),
        transform var(--duration-base) var(--ease-base);

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
    transition: var(--transition-base);
  }
}
</style>
