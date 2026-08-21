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
  @include flex-start(var(--space-3), inline-flex);

  position: relative;
  padding: var(--space-3);
  cursor: pointer;
  user-select: none;
  border-radius: 0;
  transition: var(--transition-base);

  @include ui-border-dim(var(--color-border), 50%);

  &:hover:not(.is-disabled) {
    border-color: var(--color-category-main);
    box-shadow: 0 0 var(--blur-md) theme-color(var(--color-category-main), 20%);
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &__swatch {
    flex-shrink: 0;
    width: var(--icon-size-md);
    height: var(--icon-size-md);
    border-radius: 50%;
    box-shadow: var(--shadow-sink);

    @include ui-border-dim(var(--color-border), 50%);
  }

  &__value {
    font-family: var(--font-mono);

    @extend %text-sm;

    color: var(--color-text-main);
    letter-spacing: 0.05em;
  }

  &__input {
    position: absolute;
    width: 0;
    height: 0;
    padding: 0;
    margin: 0;
    pointer-events: none;
    opacity: 0;
  }
}
</style>
