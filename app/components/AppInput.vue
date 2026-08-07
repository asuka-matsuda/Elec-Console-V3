<script setup lang="ts">
import { useId } from "vue";

const model = defineModel<string | number>();

withDefaults(
  defineProps<{
    type?:
      | "text"
      | "password"
      | "email"
      | "number"
      | "search"
      | "tel"
      | "url"
      | "textarea";
    placeholder?: string;
    disabled?: boolean;
    error?: boolean;
    size?: "sm" | "md" | "lg";
    rows?: number;
  }>(),
  {
    type: "text",
    size: "md",
    rows: 4,
  },
);

const inputId = useId();
</script>

<template>
  <textarea
    v-if="type === 'textarea'"
    :id="inputId"
    v-model="model"
    class="c-form-control c-form-control--textarea"
    :class="[`c-form-control--${size}`, { 'is-error': error }]"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="rows"
    :aria-invalid="error"
  />
  <input
    v-else
    :id="inputId"
    v-model="model"
    :type="type"
    class="c-form-control"
    :class="[`c-form-control--${size}`, { 'is-error': error }]"
    :placeholder="placeholder"
    :disabled="disabled"
    :aria-invalid="error"
  />
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
  @include form-control-base;

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
    &:is(.c-form-control--sm, .c-form-control--md, .c-form-control--lg) {
      height: auto;
    }
    &:disabled {
      resize: none;
    }
  }
}
</style>
