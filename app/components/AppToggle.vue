<script setup lang="ts">
import { useId } from "vue";

const model = defineModel<boolean>();

defineProps<{
  label?: string;
  disabled?: boolean;
}>();

const inputId = useId();
</script>

<template>
  <label class="c-toggle" :class="{ 'is-disabled': disabled }" :for="inputId">
    <input
      :id="inputId"
      v-model="model"
      type="checkbox"
      class="c-toggle__input"
      :disabled="disabled"
    >
    <div class="c-toggle__track">
      <div class="c-toggle__thumb"/>
    </div>
    <span v-if="label || $slots.default" class="c-toggle__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped lang="scss">
.c-toggle {
  --toggle-color: var(--color-category-main);
  --track-w: 44px;
  --track-h: var(--space-5);
  --thumb-w: var(--space-5);

  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  position: relative;
  font-size: var(--text-sm);
  color: var(--color-text-main);
  user-select: none;

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
    &:focus-visible + .c-toggle__track {
      @include ui-focus(var(--toggle-color));
      @include cyber-text-glow(50%, var(--blur-md), var(--toggle-color));
      transition:
        box-shadow var(--duration-slow) var(--ease-out),
        border-color var(--duration-slow) var(--ease-out);
    }

    // 2. Checked State (ON)
    &:checked + .c-toggle__track {
      border-color: theme-color(var(--toggle-color), 80%);
      box-shadow:
        0 0 10px theme-color(var(--toggle-color), 60%),
        inset 0 0 var(--blur-sm) theme-color(var(--toggle-color), 40%);

      // Slide and glow the thumb
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
    flex-shrink: 0;
    width: var(--track-w);
    height: var(--track-h);
    position: relative;
    border: var(--border-width-base) solid var(--color-border);
    box-shadow: var(--shadow-sink);
    transition: var(--transition-base);
  }

  &__thumb {
    position: absolute;
    top: -1px;
    left: -1px;
    width: var(--thumb-w);
    height: var(--track-h);
    border: var(--border-width-base) solid var(--color-border);
    box-shadow: var(--shadow-elevation-base);
    transition:
      transform var(--duration-base) var(--ease-float),
      background-color var(--duration-base) var(--ease-out),
      box-shadow var(--duration-base) var(--ease-out),
      border-color var(--duration-base) var(--ease-out);
    z-index: 1;
  }

  // 3. Hover State
  &:hover:not(.is-disabled) {
    .c-toggle__input:not(:focus-visible):not(:active) + .c-toggle__track {
      border-color: theme-color(var(--toggle-color), 50%);
      box-shadow:
        0 0 var(--blur-md) theme-color(var(--toggle-color), 40%),
        inset 0 0 var(--blur-sm) theme-color(var(--toggle-color), 20%);
    }

    // Label slightly glows on hover
    .c-toggle__label {
      color: theme-color(var(--toggle-color), 90%);
      @include cyber-text-glow(20%, var(--blur-sm), var(--toggle-color));
    }
  }

  // 4. Active (Press) State
  &:active:not(.is-disabled) {
    .c-toggle__track {
      transform: scale(0.95);
      transition: transform var(--duration-slow) var(--ease-out);
    }
    .c-toggle__thumb {
      box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5);
    }
  }
}
</style>
