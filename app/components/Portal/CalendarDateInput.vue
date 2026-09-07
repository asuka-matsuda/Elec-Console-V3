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

  width: 100%;
  padding: var(--form-control-py) var(--form-control-px);

  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  font-variant-numeric: tabular-nums;
  color: var(--color-text-muted);

  @include form-control-base;

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
