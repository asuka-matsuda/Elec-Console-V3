<script setup lang="ts">
/**
 * AtomsTextarea
 * [Atoms] 複数行のテキスト入力エリアを提供する最小フォームコントロールコンポーネント。
 */
export interface AtomsTextareaProps {
  placeholder?: string
  disabled?: boolean
  error?: boolean
  rows?: number
}

const model = defineModel<string | null>()

withDefaults(
  defineProps<AtomsTextareaProps>(),
  {
    disabled: false,
    error: false,
    rows: 4,
  },
)
</script>

<template>
  <textarea
    v-model="model"
    class="form-control relative z-[1] focus:z-[2] w-full"
    :class="{ 'is-error': error }"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="rows"
  />
</template>

<style scoped lang="scss">
.form-control {
  resize: vertical;

  min-height: calc(var(--control-height-ratio) * 2em);
  padding-block: 0.5em;
  padding-inline: 1.2em;
  border: var(--border-width-base) solid var(--color-border);

  font-size: inherit;
  line-height: var(--line-height-base);
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

  &[disabled] {
    resize: none;
  }

  @include state-disabled;
}
</style>
