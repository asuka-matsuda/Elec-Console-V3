<script setup lang="ts">
/**
 * AppInputGroup
 * Input と Select やテキストアドオンを連結して表示するためのレイアウトコンポーネント。
 */
</script>

<template>
  <div class="c-input-group">
    <slot />
    <div v-if="$slots.append" class="c-input-group__append">
      <slot name="append" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.c-input-group {
  @include flex-start-stretch;

  :deep(> *:not(.c-input-group__append)) {
    flex: 1;
    min-width: 0;
  }

  :deep(.c-form-control) {
    flex: 1;
    min-width: 0;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;

    &:focus,
    &:focus-visible {
      position: relative;
      z-index: 2;
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

      &:focus,
      &:focus-visible,
      &.is-active {
        position: relative;
        z-index: 2;
        margin-left: calc(var(--border-width-base) * -1);
        border-left: var(--border-width-base) solid var(--color-category-main);
      }
    }

    :deep(.c-custom-select) {
      flex-shrink: 0;
      width: 6em;

      &:focus-within {
        position: relative;
        z-index: 2;
      }
    }
  }
}
</style>
