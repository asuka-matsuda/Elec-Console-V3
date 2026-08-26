<script setup lang="ts">
/**
 * AppButton
 * 汎用的なボタンコンポーネント（ベース）
 */
import { computed } from "vue";
export interface AppButtonProps {
  to?: string;
  href?: string;
  type?: "button" | "submit" | "reset";
  size?: "sm" | "md";
  variant?: "primary" | "secondary" | "danger" | "success";
  block?: boolean;
  iconOnly?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<AppButtonProps>(), {
  type: "button",
  size: "sm",
  variant: "primary",
});

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
      variant !== 'primary' && `c-btn--${variant}`,
      size !== 'sm' && `c-btn--${size}`,
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
  @extend %text-meta;

  // --- レイアウト・配置 ---
  @include inline-flex-center(var(--pad-component));

  position: relative;

  flex-shrink: 0;

  // --- ボックスモデル ---
  height: var(--size-control-sm);
  padding: 0 var(--pad-component);

  // --- タイポグラフィ ---
  font-weight: var(--font-weight-semibold);

  @include border-dim(var(--btn-color));

  // --- 視覚効果 ---
  @include state-base(var(--shadow-elevation-sm), var(--transition-fast));

  // --- モディファイア（バリアント） ---
  &--danger { --btn-color: var(--color-status-danger); }
  &--success { --btn-color: var(--color-status-success); }
  &--secondary { --btn-color: var(--color-status-neutral); }

  // --- モディファイア（ブロック） ---
  &--block {
    display: flex;
    width: 100%;
  }

  // --- 疑似要素 ---
  &::after {
    content: "";

    // --- レイアウト・配置 ---
    position: absolute;
    top: 50%;
    left: 50%;

    // --- 視覚効果 ---
    transform: translate(-50%, -50%);

    // --- ボックスモデル ---
    width: 100%;
    min-width: var(--size-control-lg);
    height: 100%;
    min-height: var(--size-control-lg);
  }

  // --- 疑似クラス ---
  &:hover:not(:disabled, .is-disabled) {
    // --- レイアウト・配置 ---
    z-index: 1;

    @include state-hover(var(--btn-color));
  }

  &:focus-visible {
    // --- レイアウト・配置 ---
    z-index: 1;

    @include state-focus(var(--btn-color));

    // --- 視覚効果 ---
    @include cyber-text-glow(var(--btn-color));
  }

  &:active:not(:disabled, .is-disabled) {
    // --- レイアウト・配置 ---
    z-index: 1;

    @include state-active(var(--btn-color));

    // --- 視覚効果 ---
    @include cyber-text-glow(var(--btn-color));
  }

  &:is(:disabled, .is-disabled) {
    // --- 継承 ---
    @extend %disabled;
  }

  // --- モディファイア ---
  &--md {
    // --- 継承 ---
    @extend %text-desc;

    // --- ボックスモデル ---
    height: var(--size-control-md);
    padding: 0 var(--pad-container);
  }

  &--icon-only {
    // --- ボックスモデル ---
    width: var(--size-control-sm);
    padding: 0;

    // --- モディファイア ---
    &.c-btn--md {
      // --- ボックスモデル ---
      width: var(--size-control-md);
    }
  }
}
</style>
