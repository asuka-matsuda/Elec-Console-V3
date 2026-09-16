<script setup lang="ts">
/**
 * AtomsInput
 * テキスト入力や数値入力を提供する最小フォームコントロールコンポーネントです。
 */
export interface AtomsInputProps {
  type?:
    | 'text'
    | 'password'
    | 'email'
    | 'number'
    | 'search'
    | 'tel'
    | 'url'
    | 'date'
    | 'datetime-local'
    | 'time'
  placeholder?: string
  disabled?: boolean
  error?: boolean
}

const model = defineModel<string | number | null>()

const {
  type = 'text',
  placeholder,
  disabled = false,
  error = false,
} = defineProps<AtomsInputProps>()
</script>

<template>
  <input
    v-model="model"
    :type="type"
    class="form-control relative z-[1] focus:z-[2] w-full"
    :class="{ 'is-error': error }"
    :placeholder="placeholder"
    :disabled="disabled"
  />
</template>

<style scoped lang="scss">
.form-control {
  min-height: calc(var(--control-height-ratio) * 1em);
  padding-block: 0.3em;
  padding-inline: 1.2em;
  border: var(--border-width-base) solid var(--color-border);

  font-size: inherit;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-main);

  background-color: var(--surface-bg-elevated);
  box-shadow: var(--shadow-sink);

  transition: var(--transition-interactive);

  &:not(:disabled) {
    --glow-color: var(--theme-accent);

    &:hover {
      border-color: var(--glow-color);
      box-shadow: var(--shadow-glow-hover);
    }

    &:active {
      border-color: var(--glow-color);
      box-shadow: var(--shadow-glow-active);
    }

    &:is(:focus, :focus-visible) {
      border-color: color-mix(in srgb, var(--glow-color) 60%, transparent);
      outline: none;
      box-shadow: var(--shadow-glow-focus);
    }

    &.is-error {
      --glow-color: var(--color-status-danger);

      border-color: color-mix(in srgb, var(--glow-color) 60%, transparent);
      color: var(--glow-color);

      &:hover {
        border-color: var(--glow-color);
        box-shadow: var(--shadow-glow-hover);
      }

      &:active {
        border-color: var(--glow-color);
        box-shadow: var(--shadow-glow-active);
      }

      &:is(:focus, :focus-visible) {
        border-color: var(--glow-color);
        outline: none;
        box-shadow: var(--shadow-glow-focus);
      }
    }
  }

  &::placeholder {
    color: color-mix(in srgb, var(--color-text-muted) 50%, transparent);
    opacity: 1;
  }

  @include state-disabled;
}
</style>
