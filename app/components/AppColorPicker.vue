<script setup lang="ts">
import { useId } from "vue";

const modelValue = defineModel<string>({ default: "#000000" });

defineProps<{
  label?: string;
  disabled?: boolean;
}>();

const inputId = useId();
</script>

<template>
  <div class="c-color-picker-wrapper">
    <span v-if="label" class="c-color-picker__label">{{ label }}</span>
    <label
      class="c-color-picker"
      :class="{ 'is-disabled': disabled }"
      :for="inputId"
    >
      <!-- Visual Swatch -->
      <div
        class="c-color-picker__swatch"
        :style="{ backgroundColor: modelValue }"
      ></div>

      <!-- Hex Value Display -->
      <div class="c-color-picker__value">{{ modelValue.toUpperCase() }}</div>

      <!-- Hidden Native Input -->
      <input
        :id="inputId"
        v-model="modelValue"
        type="color"
        class="c-color-picker__input"
        :disabled="disabled"
      />
    </label>
  </div>
</template>

<style scoped lang="scss">
.c-color-picker-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.c-color-picker__label {
  @extend %text-xs;

  color: var(--color-text-muted);
}

.c-color-picker {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);

  @include ui-border-dim(var(--color-border), 50%);

  border-radius: 0;
  cursor: pointer;
  position: relative;
  transition: var(--transition-base);
  user-select: none;

  &:hover:not(.is-disabled) {
    border-color: var(--color-category-main);
    box-shadow: 0 0 var(--blur-md) theme-color(var(--color-category-main), 20%);
  }

  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &__swatch {
    width: var(--icon-size-md);
    height: var(--icon-size-md);
    border-radius: 50%;

    @include ui-border-dim(var(--color-border), 50%);

    box-shadow: var(--shadow-sink);
    flex-shrink: 0;
  }

  &__value {
    font-family: var(--font-mono);

    @extend %text-sm;

    color: var(--color-text-main);
    letter-spacing: 0.05em;
  }

  &__input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    padding: 0;
    margin: 0;
    pointer-events: none;
  }
}
</style>
