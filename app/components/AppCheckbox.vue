<script setup lang="ts">
/**
 * AppCheckbox
 * 真偽値を選択するためのチェックボックスコンポーネント
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
  <label class="c-checkbox">
    <input
      v-model="model"
      type="checkbox"
      .indeterminate="indeterminate"
      :value="value"
      :disabled="disabled"
    />
    <span class="box">
      <AppIcon name="check" class="icon is-check" />
      <AppIcon name="minus" class="icon is-dash" />
    </span>
    <span v-if="label || $slots.default" class="label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped lang="scss">
.c-checkbox {
  --checkbox-color: var(--theme-accent);
  --glow-color: var(--checkbox-color);

  cursor: pointer;
  user-select: none;

  position: relative;

  display: inline-flex;
  gap: var(--space-2);
  align-items: center;

  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  letter-spacing: var(--tracking-normal);

  &:has(:disabled) {
    cursor: not-allowed;
  }

  input {
    cursor: inherit;

    position: absolute;
    z-index: 1;
    inset: 0;

    width: 100%;
    height: 100%;

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
        box-shadow: var(--shadow-glow-active);
        transition: var(--transition-glow);

        .icon {
          filter: var(--drop-shadow-glow-sm);
        }
      }
    }

    &:checked ~ .box .is-check :deep(polyline),
    &:indeterminate ~ .box .is-dash :deep(line) {
      stroke-dashoffset: 0;
    }
  }

  .box {
    position: relative;
    z-index: 1;

    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;

    width: 1.4em;
    height: 1.4em;
    border: var(--border-width-base) solid var(--color-border);
    border-radius: var(--radius-sm);

    background-color: var(--surface-bg-elevated);

    transition: var(--transition-base);

    .icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);

      width: 70%;
      height: 70%;

      color: var(--checkbox-color);

      :deep(svg) {
        stroke-linecap: square;
        stroke-linejoin: miter;
        stroke-width: 3;
      }

      :deep(:is(polyline, line)) {
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
