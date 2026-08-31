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
  display: flex;
  width: 100%;

  &__main {
    display: flex;
    flex: 1;

    /* AppInput のボーダーと角丸を調整 */
    :deep(.c-input) {
      flex: 1;
    }
  }

  &__append {
    display: flex;

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

    :deep(.c-input-addon) {
      @include text-desc;

      padding: 0 var(--space-control-px-md);

      @include border-dim(var(--theme-accent));

      border-left: none;
      color: var(--color-text-main);
      white-space: nowrap;

      @include shadow("sink");

      @include inline-flex-center;
    }
  }
}
</style>
