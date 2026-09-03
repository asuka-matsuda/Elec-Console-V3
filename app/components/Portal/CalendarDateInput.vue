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

  @include text-mono("sm");

  width: 100%;
  padding: var(--form-control-py) var(--form-control-px);
  color: var(--color-text-muted);

  @include form-control-base;

  &--sm {
    --form-control-px: var(--space-3);
    --form-control-py: var(--space-1);

    @include text-meta;

    height: var(--size-control-sm);
  }

  &--md {
    height: var(--size-control-md);
  }
}
</style>
