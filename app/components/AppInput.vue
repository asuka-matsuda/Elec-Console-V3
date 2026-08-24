<script setup lang="ts">
/**
 * AppInput
 * テキスト入力やテキストエリアを提供するフォームコントロールコンポーネントです。
 */
import { useId } from "vue";

const model = defineModel<string | number | null>();

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
    size?: "sm" | "md";
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
  />
</template>

<style scoped lang="scss">
.c-form-control {
  // --- Theme Variables ---
  --form-control-px: var(--pad-component);
  --form-control-py: var(--pad-component);

  // --- Base Styles ---
  @extend %text-sm;
  width: 100%;
  padding: var(--form-control-py) var(--form-control-px);

  font-family: var(--font-mono);

  &::placeholder {
    color: var(--color-text-muted);
    opacity: 0.5;
  }

  // --- Size Modifiers ---
  &--sm {
    --form-control-px: var(--pad-component);
    --form-control-py: var(--pad-element);

    @extend %text-xs;

    height: var(--size-control-sm);
  }

  &--md {
    height: var(--size-control-md);
  }

  // --- Textarea Modifiers ---
  &--textarea {
    resize: vertical;
    min-height: calc(var(--size-control-md) * 2);

    // Override fixed heights so rows/min-height can take over
    &:is(.c-form-control--sm, .c-form-control--md) {
      height: auto;
    }

    &:disabled {
      resize: none;
    }
  }

  @include form-control-base;
}
</style>
