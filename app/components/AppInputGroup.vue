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
  @include flex-start-stretch;

  &__main {
    @include flex-start-stretch;

    flex: 1;

    :deep(.c-form-control) {
      flex: 1;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
  }

  &__append {
    @include flex-start-stretch;

    :deep(.c-custom-select__value),
    :deep(.c-input-addon) {
      border-left: none;
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }

    :deep(.c-custom-select__value) {
      padding-inline: 0.8em;
    }

    :deep(.c-custom-select) {
      flex-shrink: 0;
      width: 6em;
    }
  }
}
</style>
