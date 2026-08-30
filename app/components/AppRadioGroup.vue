<script setup lang="ts">
/**
 * AppRadioGroup
 * 複数の選択肢から1つを選択するための、セグメントコントロール風のラジオボタングループコンポーネント。
 */
import { useId, computed } from "vue";
import type { StyleValue } from "vue";

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
const getStyle = (option: RadioOption): StyleValue | undefined => option.color ? ({ '--radio-color': option.color } as StyleValue) : undefined;
</script>

<template>
  <div class="c-segmented-control">
    <label
      v-for="option in options"
      :key="String(option.value)"
      class="c-segmented-control__label"
      :style="getStyle(option)"
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
  --radio-color: var(--color-category-main); /* デフォルトの色 */

  display: inline-flex;
  flex-shrink: 0;
  gap: var(--space-0-5);

  width: max-content;
  padding: var(--space-0-5);

  @include border-base;

  box-shadow: none;

  &__label {
    cursor: pointer;

    &:hover {
      .c-segmented-control__input:not(:disabled, :checked)
        + .c-segmented-control__text {
        --glow-color: var(--color-border);

        border-color: var(--color-border);
        color: var(--color-text-main);
        box-shadow: var(--shadow-glow-inset-sm);
      }
    }
  }

  &__input {
    display: none;

    /* Checked state */

    &:checked + .c-segmented-control__text {
      color: var(--radio-color);

      @include state-active(var(--radio-color));
      @include cyber-text-glow(var(--radio-color), 60%, var(--blur-md));
    }

    /* Keyboard Focus state */
    &:focus-visible + .c-segmented-control__text {
      @include state-focus(var(--radio-color));
      @include cyber-text-glow(var(--radio-color), 60%, var(--blur-md));
    }

    /* Disabled state */
    &:disabled + .c-segmented-control__text {
      @include disabled;

      opacity: 0.3;
    }
  }

  &__text {
    @include text-body-bold;

    user-select: none;
    padding: var(--space-control-py-sm) var(--space-control-px-sm);

    @include border-base(transparent);

    color: var(--color-text-muted);

    @include state-base;
    @include inline-flex-center;
  }
}
</style>
