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
    class="c-form-control"
    :class="[`c-form-control--${size}`, { 'is-error': error }]"
    :disabled="disabled"
  />
</template>

<style scoped lang="scss">
.c-form-control {
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

  &--sm {
    --form-control-px: var(--space-3);
    --form-control-py: var(--space-1);

    height: var(--size-control-sm);
    font-size: var(--font-size-2xs);
    line-height: var(--line-height-base);
    color: var(--color-text-muted);
  }

  &--md {
    height: var(--size-control-md);
  }
}
</style>
