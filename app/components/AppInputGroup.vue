<script setup lang="ts">
/**
 * AppInputGroup
 * Input と Select やテキストアドオンを連結して表示するためのレイアウトコンポーネント。
 */
</script>

<template>
  <div class="c-input-group">
    <div class="c-input-group__main">
      <slot />
    </div>
    <div v-if="$slots.append" class="c-input-group__append">
      <slot name="append" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.c-input-group {
  // --- レイアウト・配置 ---
  display: flex;

  // --- ボックスモデル ---
  width: 100%;

  // --- 子要素 ---
  &__main {
    // --- レイアウト・配置 ---
    display: flex;
    flex: 1;

    /* AppInput のボーダーと角丸を調整 */

    // --- 疑似クラス ---
    :deep(.c-input) {
      // --- レイアウト・配置 ---
      flex: 1;

      // --- ボックスモデル ---
    }
  }

  &__append {
    // --- レイアウト・配置 ---
    display: flex;

    /* AppSelect のボタンや addon のボーダーを調整 */

    // --- 疑似クラス ---
    :deep(.c-custom-select__value),
    :deep(.c-input-addon) {
      // --- ボックスモデル ---
      border-left: none;
    }

    /* append領域に配置されたAppSelectは、単位選択などを想定しコンパクトな幅にする */
    :deep(.c-custom-select) {
      // --- レイアウト・配置 ---
      flex-shrink: 0;

      // --- ボックスモデル ---
      width: 5em;
    }

    :deep(.c-input-addon) {
      // --- 継承 ---
      @extend %text-desc;

      // --- ボックスモデル ---
      padding: 0 var(--pad-section);

      @include border-dim(var(--color-category-main));

      border-left: none;

      // --- タイポグラフィ ---
      color: var(--color-text-main);
      white-space: nowrap;

      // --- 視覚効果 ---
      box-shadow: var(--shadow-sink);

      // --- レイアウト・配置 ---
      @include inline-flex-center;
    }
  }
}
</style>
