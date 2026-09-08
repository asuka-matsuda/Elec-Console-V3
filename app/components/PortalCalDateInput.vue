<script setup lang="ts">
/**
 * PortalEventDateInput
 * 日付や時間の入力に特化したフォームコントロールコンポーネントです。
 */
const model = defineModel<string>()

withDefaults(
  defineProps<{
    type?: 'date' | 'datetime-local' | 'time'
    disabled?: boolean
    error?: boolean
    size?: 'sm' | 'md'
  }>(),
  {
    type: 'date',
    size: 'md',
  },
)
</script>

<template>
  <input
    v-model="model"
    :type="type"
    class="form-control"
    :class="[`form-control--${size}`, { 'is-error': error }]"
    :disabled="disabled"
  />
</template>

<style scoped lang="scss">
.form-control {
  --form-control-px: var(--space-4);
  --form-control-py: var(--space-2);

  position: relative;
  z-index: 1;

  width: 100%;
  padding: var(--form-control-py) var(--form-control-px);
  border: var(--border-width-base) solid var(--color-border);
  border-radius: var(--radius-sm);

  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  font-variant-numeric: tabular-nums;
  color: var(--color-text-muted);

  background-color: var(--surface-bg-elevated);
  box-shadow: var(--shadow-sink);

  transition: var(--transition-glow);

  &:is(:disabled, .is-disabled) {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &:not(:disabled, .is-disabled) {
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

  &--sm {
    --form-control-px: var(--space-3);
    --form-control-py: var(--space-1);

    height: var(--size-control-sm);
    font-size: var(--font-size-2xs);
    color: var(--color-text-muted);
  }

  &--md {
    height: var(--size-control-md);
  }
}
</style>
