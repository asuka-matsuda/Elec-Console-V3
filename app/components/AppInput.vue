<script setup lang="ts">
/**
 * AppInput
 * テキスト入力やテキストエリアを提供するフォームコントロールコンポーネントです。
 */
const model = defineModel<string | number | null>()

withDefaults(
  defineProps<{
    type?:
      | 'text'
      | 'password'
      | 'email'
      | 'number'
      | 'search'
      | 'tel'
      | 'url'
      | 'textarea'
    placeholder?: string
    disabled?: boolean
    error?: boolean
    size?: 'sm' | 'md'
    rows?: number
  }>(),
  {
    type: 'text',
    size: 'md',
    rows: 4,
  },
)
</script>

<template>
  <textarea
    v-if="type === 'textarea'"
    v-model="model"
    class="c-form-control c-form-control--textarea"
    :class="[`c-form-control--${size}`, { 'is-error': error }]"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="rows"
  />
  <input
    v-else
    v-model="model"
    :type="type"
    class="c-form-control"
    :class="[`c-form-control--${size}`, { 'is-error': error }]"
    :placeholder="placeholder"
    :disabled="disabled"
  />
</template>

<style scoped lang="scss">
.c-form-control {
  position: relative;
  z-index: 1;

  width: 100%;
  min-height: calc(var(--control-height-ratio) * 1em);
  padding-block: 0.3em;
  padding-inline: 1.2em;
  border: var(--border-width-base) solid var(--color-border);
  border-radius: var(--radius-sm);

  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  color: var(--color-text-main);

  background-color: var(--surface-bg-elevated);
  box-shadow: var(--shadow-sink);

  transition: var(--transition-glow);

  &:is(:disabled, .is-disabled) {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &:not(:disabled, .is-disabled) {
    &:hover {
      border-color: var(--theme-accent);
      box-shadow:
        0 0 4px color-mix(in srgb, var(--theme-accent) 45%, transparent),
        0 0 8px color-mix(in srgb, var(--theme-accent) 20%, transparent);
    }

    &:active {
      border-color: var(--theme-accent);
      box-shadow:
        0 0 4px color-mix(in srgb, var(--theme-accent) 60%, transparent),
        0 0 8px color-mix(in srgb, var(--theme-accent) 30%, transparent),
        inset 0 0 2px color-mix(in srgb, var(--theme-accent) 40%, transparent);
    }

    &:is(:focus, :focus-visible) {
      border-color: color-mix(in srgb, var(--theme-accent) 60%, transparent);
      outline: none;
      box-shadow:
        0 0 0 1px color-mix(in srgb, var(--theme-accent) 70%, transparent),
        0 0 6px color-mix(in srgb, var(--theme-accent) 50%, transparent),
        0 0 12px color-mix(in srgb, var(--theme-accent) 20%, transparent);
    }

    &.is-error {
      border-color: color-mix(in srgb, var(--color-status-danger) 60%, transparent);
      color: var(--color-status-danger);

      &:hover {
        border-color: var(--color-status-danger);
        box-shadow:
          0 0 4px color-mix(in srgb, var(--color-status-danger) 45%, transparent),
          0 0 8px color-mix(in srgb, var(--color-status-danger) 20%, transparent);
      }

      &:active {
        border-color: var(--color-status-danger);
        box-shadow:
          0 0 4px color-mix(in srgb, var(--color-status-danger) 60%, transparent),
          0 0 8px color-mix(in srgb, var(--color-status-danger) 30%, transparent),
          inset 0 0 2px color-mix(in srgb, var(--color-status-danger) 40%, transparent);
      }

      &:is(:focus, :focus-visible) {
        border-color: var(--color-status-danger);
        outline: none;
        box-shadow:
          0 0 0 1px color-mix(in srgb, var(--color-status-danger) 70%, transparent),
          0 0 6px color-mix(in srgb, var(--color-status-danger) 50%, transparent),
          0 0 12px color-mix(in srgb, var(--color-status-danger) 20%, transparent);
      }
    }
  }

  &::placeholder {
    color: color-mix(in srgb, var(--color-text-muted) 50%, transparent);
    opacity: 1;
  }

  &--sm {
    font-size: var(--font-size-2xs);
    line-height: var(--line-height-base);
    color: var(--color-text-muted);
  }

  &--textarea {
    resize: vertical;
    min-height: calc(var(--control-height-ratio) * 2em);

    &:disabled {
      resize: none;
    }
  }
}
</style>
