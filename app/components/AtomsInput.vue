<script setup lang="ts">
/**
 * AtomsInput
 * テキスト入力やテキストエリアを提供する最小フォームコントロールコンポーネントです。
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
    | 'textarea'
  placeholder?: string
  disabled?: boolean
  error?: boolean
  rows?: number
}

const model = defineModel<string | number | null>()

const {
  type = 'text',
  placeholder,
  disabled = false,
  error = false,
  rows = 4,
} = defineProps<AtomsInputProps>()
</script>

<template>
  <textarea
    v-if="type === 'textarea'"
    v-model="model"
    class="form-control relative z-[1] w-full"
    :class="{ 'is-error': error }"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="rows"
  />
  <input
    v-else
    v-model="model"
    :type="type"
    class="form-control relative z-[1] w-full"
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
  border-radius: var(--radius-sm);

  font-size: inherit;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-main);

  background-color: var(--surface-bg-elevated);
  box-shadow: var(--shadow-sink);

  transition: var(--transition-glow);

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

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
}

textarea.form-control {
  resize: vertical;
  min-height: calc(var(--control-height-ratio) * 2em);

  &:disabled {
    resize: none;
  }
}
</style>
