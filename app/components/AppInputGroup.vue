<script setup lang="ts">
// AppInputGroup.vue
// Input と Select やテキストアドオンを連結して表示するためのレイアウトコンポーネント
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
  display: flex;
  width: 100%;

  &__main {
    flex: 1;
    display: flex;

    /* AppInput のボーダーと角丸を調整 */
    :deep(.c-input) {
      flex: 1;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
  }

  &__append {
    display: flex;

    /* AppSelect のボタンや addon のボーダーを調整 */
    :deep(.c-custom-select__value),
    :deep(.c-input-addon) {
      border-left: none;
    }

    :deep(.c-input-addon) {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 var(--space-3);
      border: var(--border-width-base) solid
        theme-color(var(--color-category-main), 50%);
      border-left: none;
      box-shadow: var(--edge-reflex-base), var(--shadow-sink);
      color: var(--color-text-main);
      font-size: var(--font-size-sm);
      white-space: nowrap;
    }
  }
}
</style>
