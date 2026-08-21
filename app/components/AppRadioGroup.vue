<script setup lang="ts">
import { useId, computed } from "vue";

export interface RadioOption {
  label: string;
  value: string | number | boolean;
  disabled?: boolean;
  color?: string;
}

const model = defineModel<string | number | boolean>();

const props = defineProps<{
  options: RadioOption[];
  name?: string;
}>();

/**
 * ユニークなname属性を自動生成（複数グループが配置された際の干渉を防ぐため）
 */
const uniqueName = useId();
const groupName = computed(() => props.name || `radio-group-${uniqueName}`);
</script>

<template>
  <div class="c-segmented-control">
    <label
      v-for="option in options"
      :key="String(option.value)"
      class="c-segmented-control__label"
      :style="
        option.color ? ({ '--radio-color': option.color } as any) : undefined
      "
    >
      <input
        v-model="model"
        type="radio"
        :name="groupName"
        :value="option.value"
        :disabled="option.disabled"
        class="c-segmented-control__input"
      />
      <span class="c-segmented-control__text">{{ option.label }}</span>
    </label>
  </div>
</template>

<style scoped lang="scss">
.c-segmented-control {
  // --- Theme Variables ---
  --radio-color: var(--color-category-main); /* デフォルトの色 */

  // --- Base Styles ---
  display: inline-flex;
  flex-shrink: 0;
  gap: var(--space-1);

  width: max-content;
  padding: var(--space-1);
  border: var(--border-width-base) solid var(--color-border);

  box-shadow: none;

  /* --- Elements --- */
  &__label {
    cursor: pointer;

    &:hover {
      .c-segmented-control__input:not(:disabled, :checked)
        + .c-segmented-control__text {
        border-color: var(--color-border);
        color: var(--color-text-main);
        box-shadow: inset 0 0 var(--blur-sm) var(--color-border);
      }
    }
  }

  &__input {
    display: none;

    /* Checked state */
    &:checked + .c-segmented-control__text {
      color: var(--radio-color);

      @include ui-active(var(--radio-color));
      @include cyber-text-glow(60%, var(--blur-md), var(--radio-color));
    }

    /* Keyboard Focus state */
    &:focus-visible + .c-segmented-control__text {
      @include ui-focus(var(--radio-color));
      @include cyber-text-glow(60%, var(--blur-md), var(--radio-color));
    }

    /* Disabled state */
    &:disabled + .c-segmented-control__text {
      @extend %disabled;

      opacity: 0.3;
      filter: grayscale(100%);
    }
  }

  &__text {

    @extend %text-sm;

    user-select: none;

    padding: var(--space-2);
    border: var(--border-width-base) solid transparent;

    font-weight: var(--font-weight-bold);
    color: var(--color-text-muted);

    transition: var(--transition-base);

    @include flex-center(0, inline-flex);
  }
}
</style>
