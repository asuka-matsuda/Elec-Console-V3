<script setup lang="ts">
/**
 * AppDateInput
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
  // --- CSSカスタムプロパティ ---
  --form-control-px: var(--pad-component);
  --form-control-py: var(--pad-component);

  // --- 継承 ---
  @extend %text-desc;

  // --- ボックスモデル ---
  width: 100%;
  padding: var(--form-control-py) var(--form-control-px);

  // --- タイポグラフィ ---
  font-family: var(--font-mono);

  // --- モディファイア ---
  &--sm {
    --form-control-px: var(--pad-component);
    --form-control-py: var(--pad-element);
    @extend %text-meta;
    height: var(--size-control-sm);
  }

  &--md {
    height: var(--size-control-md);
  }

  @include form-control-base;
}
</style>
