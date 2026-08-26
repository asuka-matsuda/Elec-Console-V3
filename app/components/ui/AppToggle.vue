<script setup lang="ts">
/**
 * AppToggle
 * トグルスイッチ（チェックボックス）のUIを提供するコンポーネントです。ON/OFFの切り替えに使用されます。
 */
import { useId } from "vue";

const model = defineModel<boolean>();

defineProps<{
  label?: string;
  disabled?: boolean;
}>();

const inputId = useId();
</script>

<template>
  <label class="c-toggle" :for="inputId">
    <input
      :id="inputId"
      v-model="model"
      type="checkbox"
      class="c-toggle__input"
      :disabled="disabled"
    />
    <div class="c-toggle__track">
      <div class="c-toggle__thumb" />
    </div>
    <span v-if="label || $slots.default" class="c-toggle__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped lang="scss">
.c-toggle {
  // --- CSSカスタムプロパティ ---
  --toggle-color: var(--color-category-main);
  --track-w: 44px;
  --track-h: var(--space-5);
  --thumb-w: var(--space-5);

  // --- 継承 ---
  @extend %text-desc;

  // --- その他 ---
  cursor: pointer;
  user-select: none;

  // --- レイアウト・配置 ---
  position: relative;

  // --- 疑似クラス ---
  &:has(.c-toggle__input:disabled) {
    // --- 継承 ---
    @extend %disabled;
  }

  // --- 子要素 ---
  &__input {
    /* Hide native input visually, but keep accessible for keyboard focus */

    // --- レイアウト・配置 ---
    position: absolute;

    // --- ボックスモデル ---
    width: 0;
    height: 0;

    // --- 視覚効果 ---
    opacity: 0;

    /* 1. Keyboard Focus State */

    // --- 疑似クラス ---
    &:focus-visible + .c-toggle__track {
      @include state-focus(var(--toggle-color));

      // --- 視覚効果 ---
      @include cyber-text-glow(var(--toggle-color));
    }

    /* 2. Checked State (ON) */
    &:checked + .c-toggle__track {
      // --- ボックスモデル ---
      border-color: theme-color(var(--toggle-color), 80%);

      // --- 視覚効果 ---
      box-shadow:
        0 0 10px theme-color(var(--toggle-color), 60%),
        inset 0 0 var(--blur-sm) theme-color(var(--toggle-color), 40%);

      /* Slide and glow the thumb */

      // --- 子要素 ---
      .c-toggle__thumb {
        // --- 視覚効果 ---
        transform: translateX(calc(var(--track-w) - var(--thumb-w)));

        // --- ボックスモデル ---
        border-color: theme-color(white, 80%);

        // --- 視覚効果 ---
        box-shadow:
          0 0 var(--blur-lg) var(--toggle-color),
          inset 0 0 var(--blur-md) var(--toggle-color),
          0 0 var(--blur-sm) white;
      }
    }
  }

  &__track {
    // --- レイアウト・配置 ---
    position: relative;
    flex-shrink: 0;

    // --- ボックスモデル ---
    width: var(--track-w);
    height: var(--track-h);

    @include border-base;

    // --- 視覚効果 ---
    @include state-base(var(--shadow-sink), var(--transition-glow));
  }

  &__thumb {
    // --- レイアウト・配置 ---
    position: absolute;
    z-index: 1;
    top: -1px;
    left: -1px;

    // --- ボックスモデル ---
    width: var(--thumb-w);
    height: var(--track-h);

    @include border-base;

    // --- 視覚効果 ---
    box-shadow: var(--shadow-elevation-sm);

    transition:
      transform var(--duration-base) var(--ease-smooth),
      background-color var(--duration-base) var(--ease-base),
      box-shadow var(--duration-base) var(--ease-base),
      border-color var(--duration-base) var(--ease-base);
  }

  /* 3. Hover State */

  // --- 疑似クラス ---
  &:hover:not(:has(.c-toggle__input:disabled)) {
    // --- 疑似クラス ---
    .c-toggle__input:not(:focus-visible, :active) + .c-toggle__track {
      // --- ボックスモデル ---
      border-color: theme-color(var(--toggle-color), 50%);

      // --- 視覚効果 ---
      box-shadow:
        0 0 var(--blur-md) theme-color(var(--toggle-color), 40%),
        inset 0 0 var(--blur-sm) theme-color(var(--toggle-color), 20%);
    }

    /* Label slightly glows on hover */

    // --- 子要素 ---
    .c-toggle__label {
      // --- タイポグラフィ ---
      color: theme-color(var(--toggle-color), 90%);

      // --- 視覚効果 ---
      @include cyber-text-glow(var(--toggle-color), 20%, var(--blur-sm));
    }
  }

  /* 4. Active (Press) State */
  &:active:not(:has(.c-toggle__input:disabled)) {
    // --- 子要素 ---
    .c-toggle__track {
      // --- 視覚効果 ---
      transform: scale(0.95);
      transition: transform var(--duration-slow) var(--ease-base);
    }

    .c-toggle__thumb {
      // --- 視覚効果 ---
      box-shadow: var(--shadow-sink);
    }
  }

  // --- レイアウト・配置 ---
  @include inline-flex-start(var(--gap-component));
}
</style>
