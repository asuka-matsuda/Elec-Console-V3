<script setup lang="ts">
/**
 * AppButton
 * 汎用的なボタンコンポーネント
 */
import { computed } from "vue";
export interface AppButtonProps {
  to?: string;
  href?: string;
  type?: "button" | "submit" | "reset";
  // eslint-disable-next-line vue/prop-name-casing
  _variant?: "primary" | "secondary" | "success" | "danger";
  size?: "sm" | "md";
  block?: boolean;
  iconOnly?: boolean;
  align?: "center" | "right" | "left";
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<AppButtonProps>(),
  {
    type: "button",
    _variant: "primary",
    size: "md",
    align: "center",
  },
);

const componentTag = computed(() => {
  if (props.to) return "NuxtLink";
  if (props.href) return "a";
  return "button";
});
</script>

<template>
  <component
    :is="componentTag"
    :to="!disabled ? to : null"
    :href="!disabled ? href : null"
    :type="componentTag === 'button' ? type : null"
    :disabled="componentTag === 'button' ? disabled : null"
    class="c-btn"
    :class="[
      _variant && `c-btn--${_variant}`,
      size && `c-btn--${size}`,
      align !== 'center' && `c-btn--${align}`,
      {
        'c-btn--block': block,
        'c-btn--icon-only': iconOnly,
        'is-disabled': disabled,
      },
    ]"
    @click="disabled && $event.preventDefault()"
  >
    <slot />
  </component>
</template>

<style scoped lang="scss">
.c-btn {
  // --- CSSカスタムプロパティ ---
  --btn-color: var(--color-category-main);

  // --- 継承 ---
  @extend %click-enabled;

  // --- レイアウト・配置 ---
  @include flex-center(var(--space-2), inline-flex);

  position: relative;

  flex-shrink: 0;

  // --- タイポグラフィ ---
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-ui);
  color: var(--color-text-main);
  text-decoration: none;
  letter-spacing: 0.05em;

  // --- 視覚効果 ---
  @include border-dim(50%, var(--btn-color, var(--color-category-main)));
  @include state-base((inset 0 0 var(--blur-md) theme-color(var(--btn-color, var(--color-category-main)), 10%), var(--shadow-elevation-sm)), var(--transition-fast));

  // --- インタラクティブ状態 ---
  &:hover:not(:disabled, .is-disabled) {
    // --- レイアウト・配置 ---
    z-index: 1;

    // --- 視覚効果 ---
    @include state-hover(var(--btn-color));
  }

  &:focus-visible {
    // --- レイアウト・配置 ---
    z-index: 1;

    // --- 視覚効果 ---
    @include state-focus(var(--btn-color));
    @include cyber-text-glow(var(--btn-color));
  }

  &:active:not(:disabled, .is-disabled) {
    // --- レイアウト・配置 ---
    z-index: 1;

    // --- 視覚効果 ---
    @include state-active(var(--btn-color));
    @include cyber-text-glow(var(--btn-color));
  }

  &:is(:disabled, .is-disabled) {
    // --- 継承 ---
    @extend %disabled;
  }

  // --- モディファイア（カラー） ---
  &--primary {
    --btn-color: var(--color-category-main);
  }

  &--secondary {
    --btn-color: var(--color-status-neutral);
  }

  &--success {
    --btn-color: var(--color-status-success);
  }

  &--danger {
    --btn-color: var(--color-status-danger);
  }

  // --- モディファイア（サイズ） ---
  &--sm {
    // --- 継承 ---
    @extend %text-xs;

    // --- ボックスモデル ---
    height: var(--size-control-sm);
    padding: 0 var(--space-2);

    // --- 疑似要素 ---
    &::after {
      content: "";

      // --- レイアウト・配置 ---
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);

      // --- ボックスモデル ---
      width: 100%;
      min-width: var(--size-control-lg);
      height: 100%;
      min-height: var(--size-control-lg);
    }
  }

  &--md {
    // --- 継承 ---
    @extend %text-sm;

    // --- ボックスモデル ---
    height: var(--size-control-md);
    padding: var(--space-4);
  }

  // --- モディファイア（レイアウト） ---
  &--block {
    // --- ボックスモデル ---
    width: 100%;
  }

  &--icon-only {
    // --- ボックスモデル ---
    padding: 0;

    &.c-btn--sm {
      // --- ボックスモデル ---
      width: var(--size-control-sm);
    }

    &.c-btn--md {
      // --- ボックスモデル ---
      width: var(--size-control-md);
    }
  }

  &--left {
    // --- レイアウト・配置 ---
    justify-content: flex-start;
  }

  &--right {
    // --- レイアウト・配置 ---
    justify-content: flex-end;
  }
}
</style>
