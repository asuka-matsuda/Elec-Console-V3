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
  // --- レイアウト・配置 ---
  @include inline-flex-start(var(--gap-component));

  // --- その他 ---
  cursor: pointer;
  user-select: none;

  // --- レイアウト・配置 ---
  position: relative;

  // --- ボックスモデル ---
  height: var(--size-control-md);
  padding: 0 var(--pad-component);

  @include form-control-base(
    $is-active: "&:has(.c-color-picker__input:focus-visible)"
  );

  // --- 子要素 ---
  &__swatch {
    // --- レイアウト・配置 ---
    flex-shrink: 0;

    // --- ボックスモデル ---
    width: var(--icon-size-sm);
    height: var(--icon-size-sm);
    border-radius: 50%;

    // --- 視覚効果 ---
    box-shadow: var(--shadow-sink);

    @include border-dim;
  }

  &__value {
    // --- 継承 ---
    @include text-desc;

    // --- タイポグラフィ ---
    font-family: var(--font-mono);
    color: var(--color-text-main);
  }

  &__input {
    // Hide native input visually, but keep accessible for keyboard focus

    // --- レイアウト・配置 ---
    position: absolute;

    // --- ボックスモデル ---
    width: 0;
    height: 0;

    // --- 視覚効果 ---
    opacity: 0;
  }
}
</style>
