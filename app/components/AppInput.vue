<script setup lang="ts">
import { useId } from 'vue'

const model = defineModel<string | number>()

const props = withDefaults(defineProps<{
  type?: 'text' | 'password' | 'email' | 'number' | 'search' | 'tel' | 'url' | 'textarea'
  placeholder?: string
  disabled?: boolean
  error?: boolean
  size?: 'sm' | 'md' | 'lg'
  rows?: number
}>(), {
  type: 'text',
  size: 'md',
  rows: 4
})

const inputId = useId()
</script>

<template>
  <textarea
    v-if="type === 'textarea'"
    :id="inputId"
    class="c-form-control c-form-control--textarea"
    :class="[
      `c-form-control--${size}`,
      { 'is-error': error }
    ]"
    v-model="model"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="rows"
  ></textarea>
  <input
    v-else
    :id="inputId"
    :type="type"
    class="c-form-control"
    :class="[
      `c-form-control--${size}`,
      { 'is-error': error }
    ]"
    v-model="model"
    :placeholder="placeholder"
    :disabled="disabled"
  >
</template>

<style scoped lang="scss">
.c-form-control {
  --form-control-px: var(--space-2);
  --form-control-py: var(--space-2);

  box-sizing: border-box;
  width: 100%;
  padding: var(--form-control-py) var(--form-control-px);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-text-main);
  background-color: transparent;
  border: var(--border-width-base) solid glass-color(25%);
  box-shadow: var(--edge-reflex-base), var(--shadow-sink);
  transition: var(--transition-base);

  &::placeholder {
    color: var(--color-text-muted);
    opacity: 0.5;
  }

  /* Size Modifiers */
  &--sm {
    --form-control-px: var(--space-2);
    --form-control-py: var(--space-1);
    height: var(--size-control-sm);
    font-size: var(--text-xs);
  }

  &--md {
    height: var(--size-control-md);
  }

  &--lg {
    --form-control-px: var(--space-4);
    --form-control-py: var(--space-3);
    height: var(--size-control-lg);
    font-size: var(--text-base);
  }

  /* Textarea Modifiers */
  &--textarea {
    resize: vertical;
    min-height: calc(var(--size-control-md) * 2);
    // Override fixed heights so rows/min-height can take over
    &.c-form-control--sm,
    &.c-form-control--md,
    &.c-form-control--lg {
      height: auto;
    }
    &:disabled {
      resize: none;
    }
  }

  /* Interaction States */
  &:hover:not(:disabled):not(.is-error):not(:focus) {
    @include ui-hover-glow;
  }

  &:focus,
  &:focus-visible {
    outline: none;
    @include ui-focus(var(--color-category-main));
    @include cyber-text-glow(50%, 8px, var(--color-category-main));
    
    // 発光（フォーカス）のアニメーションを遅くして高級感を出す
    transition: box-shadow var(--duration-slow) var(--ease-out),
                border-color var(--duration-slow) var(--ease-out);
  }

  /* Error State */
  &.is-error {
    color: var(--color-status-danger);
    border-color: var(--color-status-danger);
    box-shadow:
      inset 0 0 var(--blur-sm) theme-color(var(--color-status-danger), 30%),
      0 0 6px theme-color(var(--color-status-danger), 50%);

    &:hover:not(:disabled):not(:focus) {
      @include ui-hover-glow(var(--color-status-danger));
    }

    &:focus,
    &:focus-visible {
      @include cyber-text-glow(50%, 8px, var(--color-status-danger));
      transition: box-shadow var(--duration-slow) var(--ease-out),
                  border-color var(--duration-slow) var(--ease-out);
    }
  }

  /* Disabled State */
  &:disabled {
    @extend %disabled;
    background-color: glass-color(5%);
  }
}
</style>
