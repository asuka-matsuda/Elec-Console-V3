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
  <label
    class="c-checkbox"
    :class="[`c-checkbox--${color}`, { 'is-disabled': disabled }]"
    :for="inputId"
  >
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
  --checkbox-color: var(--color-category-main);

  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  position: relative;
  font-size: var(--text-sm);
  color: var(--color-text-main);
  user-select: none;

  &--success {
    --checkbox-color: var(--color-status-success);
  }
  &--danger {
    --checkbox-color: var(--color-status-danger);
  }
  &--warning {
    --checkbox-color: var(--color-status-warning);
  }

  &.is-disabled {
    cursor: not-allowed;
    @extend %disabled;
  }

  &__input {
    // Hide native input visually, but keep accessible for keyboard focus
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    margin: 0;

    // 1. Keyboard Focus State
    &:focus-visible + .c-checkbox__box {
      @include ui-focus(var(--checkbox-color));
      @include cyber-text-glow(50%, var(--blur-md), var(--checkbox-color));
      transition:
        box-shadow var(--duration-slow) var(--ease-out),
        border-color var(--duration-slow) var(--ease-out);
    }

    // 2. Checked State
    &:checked + .c-checkbox__box {
      @include ui-active(var(--checkbox-color));

      .c-checkbox__icon {
        stroke-dashoffset: 0;
        opacity: 1;
        filter: drop-shadow(0 0 var(--blur-sm) var(--checkbox-color));
      }
    }
  }

  &__box {
    flex-shrink: 0;
    width: 1.4em;
    height: 1.4em;
    display: flex;
    align-items: center;
    justify-content: center;
    border: var(--border-width-base) solid var(--color-border);
    box-shadow: var(--edge-reflex-base), var(--shadow-sink);
    transition: var(--transition-base);
    // Explicitly NO border-radius to ensure sharp corners

    // Icon animation setup
    .c-checkbox__icon {
      width: 70%;
      height: 70%;
      stroke: var(--checkbox-color);
      opacity: 0;
      stroke-dasharray: 24;
      stroke-dashoffset: 24;
      transition: var(--transition-base);
    }
  }

  // 3. Hover State
  &:hover:not(.is-disabled) {
    .c-checkbox__input:not(:focus-visible):not(:active) + .c-checkbox__box {
      @include ui-hover-glow(var(--checkbox-color));
    }

    // Label slightly glows on hover
    .c-checkbox__label {
      color: theme-color(var(--checkbox-color), 90%);
      @include cyber-text-glow(20%, var(--blur-sm), var(--checkbox-color));
    }
  }

  // 4. Active (Press) State
  &:active:not(.is-disabled) {
    .c-checkbox__box {
      @include ui-press(var(--checkbox-color));
    }
  }
}
</style>
