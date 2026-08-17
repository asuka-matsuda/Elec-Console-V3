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

    /* AppSelect や addon のボーダーと角丸を調整 */
    :deep(select),
    :deep(.c-input-addon) {
      border-left: none;
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }

    :deep(.c-input-addon) {
      display: inline-flex;
      align-items: center;
      padding: var(--space-3);
      background: var(--color-bg-base);
      border: var(--border-width-base) solid var(--color-border);
      border-left: none;
      border-radius: 0 var(--radius-base) var(--radius-base) 0;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
      white-space: nowrap;
    }
  }
}
</style>
