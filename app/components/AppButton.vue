<script setup lang="ts">
import { computed } from "vue";

// ① withDefaults を使って「初期値」を定義する
const props = withDefaults(
  defineProps<{
    to?: string;
    href?: string;
    type?: "button" | "submit" | "reset";
    // eslint-disable-next-line vue/prop-name-casing
    _variant?: "primary" | "secondary" | "success" | "danger";
    size?: "sm" | "md" | "lg";
    block?: boolean;
    iconOnly?: boolean;
    align?: "center" | "right" | "left";
    disabled?: boolean;
  }>(),
  {
    type: "button",
    _variant: "primary",
    size: "md",
    align: "center",
  },
);

// ② タグ判定を独立させ、ネストした三項演算子を排除
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
      /* ③ Vueの配列＋オブジェクト構文でクラス付与をDRYに */
      _variant && `c-btn--${_variant}`,
      size !== 'md' && `c-btn--${size}`,
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
  @extend %click-enabled;

  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  gap: var(--space-2);
  align-items: center;
  justify-content: center;
  height: var(--size-control-md);
  padding: var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-ui);
  color: var(--color-text-main);
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: var(--transition-base), var(--transition-colors);

  /* 視認性確保のための枠線と影（アウトラインスタイル） */
  @include ui-border-dim(var(--btn-color, var(--color-category-main)), 50%);

  box-shadow:
    inset 0 0 var(--blur-md)
      theme-color(var(--btn-color, var(--color-category-main)), 10%),
    0 var(--space-1) var(--space-3) rgb(0 0 0 / 20%);

  // 以前の ui-surface は枠線を上書きしてしまうため今回は無効化
  // @include ui-surface;

  /* State Variables */
  --btn-color: var(--color-category-main); // Default interaction color

  /* Interaction States */
  &:hover:not(:disabled, .is-disabled) {
    z-index: 1;

    @include ui-hover-glow(var(--btn-color));
  }

  &:focus-visible {
    z-index: 1;

    @include ui-focus(var(--btn-color));
    @include cyber-text-glow(50%, 8px, var(--btn-color));
  }

  &:active:not(:disabled, .is-disabled) {
    z-index: 1;

    @include ui-press(var(--btn-color));
    @include cyber-text-glow(50%, 8px, var(--btn-color));
  }

  /* Disabled State */
  &:is(:disabled, .is-disabled) {
    @extend %disabled;
  }

  /* Color Modifiers */
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

  /* Size Modifiers */
  &--sm {
    height: var(--size-control-sm);
    padding: var(--space-3);
    font-size: var(--font-size-xs);

    // Minimum touch target (48x48) for accessibility
    &::after {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 100%;
      min-width: var(--size-control-lg);
      height: 100%;
      min-height: var(--size-control-lg);
      content: "";
      transform: translate(-50%, -50%);
    }
  }

  &--lg {
    height: var(--size-control-lg);
    padding: var(--space-5);
    font-size: var(--font-size-base);
  }

  /* Layout Modifiers */
  &--block {
    width: 100%;
  }

  &--icon-only {
    width: var(--size-control-md);
    padding: 0;

    &.c-btn--sm {
      width: var(--size-control-sm);
    }
  }

  &--left {
    justify-content: flex-start;
  }

  &--right {
    justify-content: flex-end;
  }
}
</style>
