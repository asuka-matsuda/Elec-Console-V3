<script setup lang="ts">
/**
 * AppRadioGroup
 * 複数の選択肢から1つを選択するための、セグメントコントロール風のラジオボタングループコンポーネント。
 */
import type { StyleValue } from "vue";
import { computed, useId } from "vue";

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
const getStyle = (option: RadioOption): StyleValue | undefined =>
  option.color ? ({ "--radio-color": option.color } as StyleValue) : undefined;
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
  --radio-color: var(--theme-accent); /* デフォルトの色 */

  @include flex-start-center($is-inline: true);

  flex-shrink: 0;
  gap: var(--space-0-5);
  align-items: stretch;

  width: max-content;
  padding: var(--space-0-5);

  @include border-base;
  @include shadow("none");

  &__label {
    @include click-enabled;

    position: relative;

    &:not(:has(.c-segmented-control__input:disabled)) {
      &:hover {
        .c-segmented-control__input:not(:checked) + .c-segmented-control__text {
          color: var(--color-text-main);

          @include state-hover(var(--color-border));
        }
      }

      &:active {
        .c-segmented-control__text {
          @include state-active(var(--radio-color));
        }
      }
    }
  }

  &__input {
    pointer-events: none;

    position: absolute;

    width: 0;
    height: 0;

    opacity: 0;

    /* Checked state */

    &:checked + .c-segmented-control__text {
      --glow-color: var(--radio-color);

      border-color: var(--radio-color);
      color: var(--radio-color);

      @include state-active(var(--theme-accent));
      @include cyber-text-glow(var(--radio-color), 60%, var(--blur-md));
    }

    /* Keyboard Focus state */
    &:focus-visible + .c-segmented-control__text {
      @include state-focus(var(--radio-color));
      @include cyber-text-glow(var(--radio-color), 60%, var(--blur-md));
    }

    /* Disabled state */
    &:disabled + .c-segmented-control__text {
      opacity: 0.3;

      @include disabled;
    }
  }

  &__text {
    @include text-body("md", "bold");
    @include flex-center-center($is-inline: true);

    padding: var(--space-1) var(--space-3);
    color: var(--color-text-muted);

    @include border-base(transparent);
    @include state-base;
  }
}
</style>
