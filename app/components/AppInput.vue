<script setup lang="ts">
/**
 * AppInput
 * テキスト入力やテキストエリアを提供するフォームコントロールコンポーネントです。
 */
import { useId } from 'vue'

const model = defineModel<string | number | null>()

withDefaults(
  defineProps<{
    type?: 'text' | 'password' | 'email' | 'number' | 'search' | 'tel' | 'url' | 'textarea'
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

const inputId = useId()
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
  --form-control-px: var(--space-4);
  --form-control-py: var(--space-2);

  @include text-mono("sm");

  width: 100%;
  padding: var(--form-control-py) var(--form-control-px);
  color: var(--color-text-muted);

  @include form-control-base;

  &::placeholder {
    @include form-placeholder;
  }

  &--sm {
    --form-control-px: var(--space-3);
    --form-control-py: var(--space-1);

    @include text-meta;

    height: var(--size-control-sm);
  }

  &--md {
    height: var(--size-control-md);
  }

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
}
</style>
