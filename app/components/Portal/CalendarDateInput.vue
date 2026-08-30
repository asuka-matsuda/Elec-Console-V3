<script setup lang="ts">
/**
 * PortalEventDateInput
 * 日付や時間の入力に特化したフォームコントロールコンポーネントです。
 */
import { useId } from "vue";

const model = defineModel<string>();

withDefaults(
  defineProps<{
    type?: "date" | "datetime-local" | "time";
    disabled?: boolean;
    error?: boolean;
    size?: "sm" | "md";
  }>(),
  {
    type: "date",
    size: "md",
  }
);

const inputId = useId();
</script>

<template>
  <input
    :id="inputId"
    v-model="model"
    :type="type"
    class="c-form-control"
    :class="[`c-form-control--${size}`, { 'is-error': error }]"
    :disabled="disabled"
  />
</template>

<style scoped lang="scss">
.c-form-control {
  --form-control-px: var(--space-control-px-md);
  --form-control-py: var(--space-control-py-md);

  @include text-desc;

  width: 100%;
  padding: var(--form-control-py) var(--form-control-px);
  font-family: var(--font-mono);

  &--sm {
    --form-control-px: var(--space-control-px-sm);
    --form-control-py: var(--space-control-py-sm);

    @include text-meta;

    height: var(--size-control-sm);
  }

  &--md {
    height: var(--size-control-md);
  }

  @include form-control-base;
}
</style>
