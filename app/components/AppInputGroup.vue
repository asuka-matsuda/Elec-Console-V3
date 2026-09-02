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
    <div
      v-if="$slots.append"
      class="c-input-group__append"
    >
      <slot name="append" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.c-input-group {
  @include flex-start-stretch;

  width: 100%;

  &__main {
    @include flex-start-stretch;

    flex: 1;

    /* AppInput のボーダーと角丸を調整 */
    :deep(.c-input) {
      flex: 1;
    }
  }

  &__append {
    @include flex-start-stretch;

    /* AppSelect のボタンや addon のボーダーを調整 */
    :deep(.c-custom-select__value),
    :deep(.c-input-addon) {
      border-left: none;
    }

    /* append領域に配置されたAppSelectは、単位選択などを想定しコンパクトな幅にする */
    :deep(.c-custom-select) {
      flex-shrink: 0;
      width: 5em;
    }
  }
}
</style>
