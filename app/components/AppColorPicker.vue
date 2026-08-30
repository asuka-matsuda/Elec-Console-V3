<script setup lang="ts">
/**
 * AppColorPicker
 * 色を選択するためのカラーピッカーコンポーネント
 */
import { useId } from "vue";

const modelValue = defineModel<string>({ default: "#000000" });

defineProps<{
  disabled?: boolean;
}>();

const inputId = useId();
</script>

<template>
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
</template>

<style scoped lang="scss">
.c-color-picker {
  @include inline-flex-start(var(--space-inline-gap));

  cursor: pointer;
  user-select: none;

  position: relative;

  height: var(--size-control-md);
  padding: 0 var(--space-control-px-md);

  @include form-control-base(
    $is-active: "&:has(.c-color-picker__input:focus-visible)"
  );

  &__swatch {
    flex-shrink: 0;

    width: var(--icon-size-sm);
    height: var(--icon-size-sm);
    border-radius: 50%;

    box-shadow: var(--shadow-sink);

    @include border-dim;
  }

  &__value {
    @include text-desc;

    font-family: var(--font-mono);
    color: var(--color-text-main);
  }

  &__input {
    // Hide native input visually, but keep accessible for keyboard focus
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;
  }
}
</style>
