<script setup lang="ts">
/**
 * AppCheckbox
 * 真偽値を選択するためのチェックボックスコンポーネント
 */
import { useId } from "vue";

const model = defineModel<boolean | unknown[]>();

defineProps<{
  value?: unknown;
  label?: string;
  disabled?: boolean;
}>();

const inputId = useId();
</script>

<template>
  <label class="c-checkbox" :for="inputId">
    <input
      :id="inputId"
      v-model="model"
      type="checkbox"
      class="c-checkbox__input"
      :value="value"
      :disabled="disabled"
    />
    <div class="c-checkbox__box">
      <!-- Checkmark SVG: Animated via stroke-dashoffset -->
      <svg
        class="c-checkbox__icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="square"
        stroke-linejoin="miter"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
    <span v-if="label || $slots.default" class="c-checkbox__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped lang="scss">
.c-checkbox {
  // --- CSSカスタムプロパティ ---
  --checkbox-color: var(--color-category-main);

  // --- 継承 ---
  @extend %text-desc;

  // --- その他 ---
  cursor: pointer;
  user-select: none;

  // --- レイアウト・配置 ---
  position: relative;

  // --- 疑似クラス ---
  &:has(.c-checkbox__input:disabled) {
    // --- 継承 ---
    @extend %disabled;
  }

  // --- 子要素 ---
  &__input {
    // Hide native input visually, but keep accessible for keyboard focus

    // --- レイアウト・配置 ---
    position: absolute;

    // --- ボックスモデル ---
    width: 0;
    height: 0;

    // --- 視覚効果 ---
    opacity: 0;
  }

  // 1. Keyboard Focus State

  // --- 疑似クラス ---
  &:has(.c-checkbox__input:focus-visible) .c-checkbox__box {
    @include state-focus(var(--checkbox-color));

    // --- 視覚効果 ---
    @include cyber-text-glow(var(--checkbox-color));
  }

  // 2. Checked State
  &:has(.c-checkbox__input:checked) .c-checkbox__box {
    @include state-active(var(--checkbox-color));

    // --- 子要素 ---
    .c-checkbox__icon {
      // --- 視覚効果 ---
      opacity: 1;
      filter: drop-shadow(0 0 var(--blur-sm) var(--checkbox-color));
      stroke-dashoffset: 0;
    }
  }

  // --- 子要素 ---
  &__box {
    // --- レイアウト・配置 ---
    flex-shrink: 0;

    // --- ボックスモデル ---
    width: 1.4em;
    height: 1.4em;

    // --- レイアウト・配置 ---
    @include flex-center;
    @include border-dim;

    // --- 視覚効果 ---
    @include state-base(var(--shadow-sink));

    // Explicitly NO border-radius to ensure sharp corners

    // Icon animation setup

    // --- 子要素 ---
    .c-checkbox__icon {
      // --- ボックスモデル ---
      width: 70%;
      height: 70%;

      // --- 視覚効果 ---
      opacity: 0;

      stroke: var(--checkbox-color);
      stroke-dasharray: 24;
      stroke-dashoffset: 24;

      @include state-base;
    }
  }

  // 3. Hover State

  // --- 疑似クラス ---
  &:hover:not(:has(.c-checkbox__input:disabled)) {
    // --- 疑似クラス ---
    &:has(.c-checkbox__input:not(:focus-visible, :active)) .c-checkbox__box {
      @include state-hover(var(--checkbox-color));
    }

    // Label slightly glows on hover

    // --- 子要素 ---
    .c-checkbox__label {
      // --- タイポグラフィ ---
      color: theme-color(var(--checkbox-color), 90%);

      // --- 視覚効果 ---
      @include cyber-text-glow(var(--checkbox-color), 20%, var(--blur-sm));
    }
  }

  // 4. Active (Press) State
  &:active:not(:has(.c-checkbox__input:disabled)) .c-checkbox__box {
    @include state-active(var(--checkbox-color));
  }

  // --- レイアウト・配置 ---
  @include inline-flex-start(var(--gap-component));
}
</style>
