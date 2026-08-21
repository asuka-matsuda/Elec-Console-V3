<script setup lang="ts">
import { useId } from "vue";

const model = defineModel<boolean | unknown[]>();

withDefaults(
  defineProps<{
    value?: unknown;
    label?: string;
    disabled?: boolean;
    error?: boolean;
    color?: "primary" | "success" | "danger" | "warning";
  }>(),
  {
    color: "primary",
  },
);

const inputId = useId();
</script>

<template>
  <label class="c-checkbox" :class="`c-checkbox--${color}`" :for="inputId">
    <input
      :id="inputId"
      v-model="model"
      type="checkbox"
      class="c-checkbox__input"
      :value="value"
      :disabled="disabled"
      :aria-invalid="error"
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
  // --- Theme Variables ---
  --checkbox-color: var(--color-category-main);

  // --- Base Styles ---
  @extend %text-sm;

  cursor: pointer;
  user-select: none;
  position: relative;
  color: var(--color-text-main);

  // --- Color Modifiers ---
  &--success {
    --checkbox-color: var(--color-status-success);
  }

  &--danger {
    --checkbox-color: var(--color-status-danger);
  }

  &--warning {
    --checkbox-color: var(--color-status-warning);
  }

  &:has(.c-checkbox__input:disabled) {

    @extend %disabled;

    cursor: not-allowed;
  }

  &__input {
    // Hide native input visually, but keep accessible for keyboard focus
    position: absolute;

    width: 0;
    height: 0;
    margin: 0;

    opacity: 0;
  }

  // 1. Keyboard Focus State
  &:has(.c-checkbox__input:focus-visible) .c-checkbox__box {
    @include ui-focus(var(--checkbox-color));
    @include cyber-text-glow(50%, var(--blur-md), var(--checkbox-color));

    transition:
      box-shadow var(--duration-slow) var(--ease-out),
      border-color var(--duration-slow) var(--ease-out);
  }

  // 2. Checked State
  &:has(.c-checkbox__input:checked) .c-checkbox__box {
    @include ui-active(var(--checkbox-color));

    .c-checkbox__icon {
      opacity: 1;
      filter: drop-shadow(0 0 var(--blur-sm) var(--checkbox-color));
      stroke-dashoffset: 0;
    }
  }

  &__box {
    flex-shrink: 0;

    width: 1.4em;
    height: 1.4em;

    @include flex-center;
    @include ui-border-dim(var(--color-border), 50%);

    box-shadow: var(--edge-reflex-base), var(--shadow-sink);

    transition: var(--transition-base);

    // Explicitly NO border-radius to ensure sharp corners

    // Icon animation setup
    .c-checkbox__icon {
      width: 70%;
      height: 70%;

      opacity: 0;

      stroke: var(--checkbox-color);
      stroke-dasharray: 24;
      stroke-dashoffset: 24;

      transition: var(--transition-base);
    }
  }

  // 3. Hover State
  &:hover:not(:has(.c-checkbox__input:disabled)) {
    &:has(.c-checkbox__input:not(:focus-visible, :active)) .c-checkbox__box {
      @include ui-hover-glow(var(--checkbox-color));
    }

    // Label slightly glows on hover
    .c-checkbox__label {
      color: theme-color(var(--checkbox-color), 90%);

      @include cyber-text-glow(20%, var(--blur-sm), var(--checkbox-color));
    }
  }

  // 4. Active (Press) State
  &:active:not(:has(.c-checkbox__input:disabled)) .c-checkbox__box {
    @include ui-press(var(--checkbox-color));
  }

  @include flex-start(var(--space-2), inline-flex);
}
</style>
