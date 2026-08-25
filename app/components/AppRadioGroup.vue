<script setup lang="ts">
/**
 * AppRadioGroup
 * 複数の選択肢から1つを選択するための、セグメントコントロール風のラジオボタングループコンポーネント。
 */
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
  // --- CSSカスタムプロパティ ---
  --radio-color: var(--color-category-main); /* デフォルトの色 */

  // --- レイアウト・配置 ---
  display: inline-flex;
  flex-shrink: 0;
  gap: var(--gap-element);

  // --- ボックスモデル ---
  width: max-content;
  padding: var(--pad-element);
  @include border-base;

  // --- 視覚効果 ---
  box-shadow: none;

  // --- 子要素 ---
  &__label {
    // --- その他 ---
    cursor: pointer;

    // --- 疑似クラス ---
    &:hover {
      // --- 疑似クラス ---
      .c-segmented-control__input:not(:disabled, :checked)
        + .c-segmented-control__text {
        // --- CSSカスタムプロパティ ---
        --glow-color: var(--color-border);

        // --- ボックスモデル ---
        border-color: var(--color-border);

        // --- タイポグラフィ ---
        color: var(--color-text-main);

        // --- 視覚効果 ---
        box-shadow: var(--shadow-glow-inset-sm);
      }
    }
  }

  &__input {
    // --- レイアウト・配置 ---
    display: none;

    /* Checked state */

    // --- 疑似クラス ---
    &:checked + .c-segmented-control__text {
      // --- タイポグラフィ ---
      color: var(--radio-color);

      @include state-active(var(--radio-color));

      // --- 視覚効果 ---
      @include cyber-text-glow(var(--radio-color), 60%, var(--blur-md));
    }

    /* Keyboard Focus state */
    &:focus-visible + .c-segmented-control__text {
      @include state-focus(var(--radio-color));

      // --- 視覚効果 ---
      @include cyber-text-glow(var(--radio-color), 60%, var(--blur-md));
    }

    /* Disabled state */
    &:disabled + .c-segmented-control__text {
      // --- 継承 ---
      @extend %disabled;

      // --- 視覚効果 ---
      opacity: 0.3;
      filter: grayscale(100%);
    }
  }

  &__text {
    // --- 継承 ---
    @extend %text-title-sm;

    // --- その他 ---
    user-select: none;

    // --- ボックスモデル ---
    padding: var(--pad-component);
    border: var(--border-width-base) solid transparent;

    // --- タイポグラフィ ---
    color: var(--color-text-muted);

    // --- 視覚効果 ---
    transition: var(--transition-base);

    // --- レイアウト・配置 ---
    @include flex-center(0, inline-flex);
  }
}
</style>
