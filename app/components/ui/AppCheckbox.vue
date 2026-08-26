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
  <label class="c-checkbox" :class="{ 'is-disabled': disabled }" :for="inputId">
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

  // --- レイアウト・配置 ---
  @include inline-flex-start(var(--gap-component));
  position: relative;

  // --- その他 ---
  cursor: pointer;
  user-select: none;

  // --- 状態 (Vue制御) ---
  &.is-disabled {
    @extend %disabled;
    cursor: not-allowed;
  }

  // --- ホバー & アクティブ状態 (親要素への作用) ---
  &:hover:not(.is-disabled) {
    // ラベルのグロウ効果
    .c-checkbox__label {
      color: theme-color(var(--checkbox-color), 90%);
      @include cyber-text-glow(var(--checkbox-color), 20%, var(--blur-sm));
    }
    
    // ホバー時のboxハイライト (inputがフォーカス/アクティブ/チェックされていない時のみ)
    .c-checkbox__input:not(:focus-visible, :active, :checked) + .c-checkbox__box {
      @include state-hover(var(--checkbox-color));
    }
  }

  &:active:not(.is-disabled) .c-checkbox__box {
    @include state-active(var(--checkbox-color));
  }

  // --- input本体 (非表示にしつつ隣接セレクタでboxを操作) ---
  &__input {
    // 視覚的には隠すがフォーカスは当たるようにする
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;

    // フォーカス時のGlow
    &:focus-visible + .c-checkbox__box {
      @include state-focus(var(--checkbox-color));
      @include cyber-text-glow(var(--checkbox-color));
    }

    // チェック時の状態
    &:checked + .c-checkbox__box {
      @include state-active(var(--checkbox-color));

      .c-checkbox__icon {
        opacity: 1;
        filter: drop-shadow(0 0 var(--blur-sm) var(--checkbox-color));
        stroke-dashoffset: 0;
      }
    }
  }

  // --- Box (四角い枠) ---
  &__box {
    flex-shrink: 0;
    width: 1.4em;
    height: 1.4em;
    @include flex-center;
    @include border-dim;
    @include state-base(var(--shadow-sink));

    // アイコン (初期状態は透明かつstroke-dashoffsetで隠す)
    .c-checkbox__icon {
      width: 70%;
      height: 70%;
      opacity: 0;
      stroke: var(--checkbox-color);
      stroke-dasharray: 24;
      stroke-dashoffset: 24;
      @include state-base;
    }
  }

  // --- ラベル ---
  &__label {
    @include state-base;
  }
}
</style>
