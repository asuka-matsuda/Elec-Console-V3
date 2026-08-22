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
  // --- Theme Variables ---
  --toggle-color: var(--color-category-main);
  --track-w: 44px;
  --track-h: var(--space-5);
  --thumb-w: var(--space-5);

  // --- Base Styles ---
  @extend %text-sm;

  cursor: pointer;
  user-select: none;
  position: relative;
  color: var(--color-text-main);

  &:has(.c-toggle__input:disabled) {
    @extend %disabled;
  }

  &__input {
    /* Hide native input visually, but keep accessible for keyboard focus */
    position: absolute;

    width: 0;
    height: 0;
    margin: 0;

    opacity: 0;

    /* 1. Keyboard Focus State */
    &:focus-visible + .c-toggle__track {
      @include focus(var(--toggle-color));
      @include cyber-text-glow($color: var(--toggle-color));

      transition:
        box-shadow var(--duration-slow) var(--ease-base),
        border-color var(--duration-slow) var(--ease-base);
    }

    /* 2. Checked State (ON) */
    &:checked + .c-toggle__track {
      border-color: theme-color(var(--toggle-color), 80%);
      box-shadow:
        0 0 10px theme-color(var(--toggle-color), 60%),
        inset 0 0 var(--blur-sm) theme-color(var(--toggle-color), 40%);

      /* Slide and glow the thumb */
      .c-toggle__thumb {
        transform: translateX(calc(var(--track-w) - var(--thumb-w)));
        border-color: theme-color(white, 80%);
        box-shadow:
          0 0 var(--blur-lg) var(--toggle-color),
          inset 0 0 var(--blur-md) var(--toggle-color),
          0 0 var(--blur-sm) white;
      }
    }
  }

  &__track {
    position: relative;

    flex-shrink: 0;

    width: var(--track-w);
    height: var(--track-h);
    border: var(--border-width-base) solid var(--color-border);

    box-shadow: var(--shadow-sink);

    transition: var(--transition-base);
  }

  &__thumb {
    position: absolute;
    z-index: 1;
    top: -1px;
    left: -1px;

    width: var(--thumb-w);
    height: var(--track-h);
    border: var(--border-width-base) solid var(--color-border);

    box-shadow: var(--shadow-elevation-sm);

    transition:
      transform var(--duration-base) var(--ease-smooth),
      background-color var(--duration-base) var(--ease-base),
      box-shadow var(--duration-base) var(--ease-base),
      border-color var(--duration-base) var(--ease-base);
  }

  /* 3. Hover State */
  &:hover:not(:has(.c-toggle__input:disabled)) {
    .c-toggle__input:not(:focus-visible, :active) + .c-toggle__track {
      border-color: theme-color(var(--toggle-color), 50%);
      box-shadow:
        0 0 var(--blur-md) theme-color(var(--toggle-color), 40%),
        inset 0 0 var(--blur-sm) theme-color(var(--toggle-color), 20%);
    }

    /* Label slightly glows on hover */
    .c-toggle__label {
      color: theme-color(var(--toggle-color), 90%);

      @include cyber-text-glow(20%, var(--blur-sm), var(--toggle-color));
    }
  }

  /* 4. Active (Press) State */
  &:active:not(:has(.c-toggle__input:disabled)) {
    .c-toggle__track {
      transform: scale(0.95);
      transition: transform var(--duration-slow) var(--ease-base);
    }

    .c-toggle__thumb {
      box-shadow: var(--shadow-sink);
    }
  }

  @include flex-start(var(--space-2), inline-flex);
}
</style>
