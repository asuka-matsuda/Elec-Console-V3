<script setup lang="ts">
/**
 * MoleculesInputGroup
 * [Molecules] Input と Select や単位テキストアドオンを連結して表示するためのレイアウトコンポーネント。
 */
interface Props {
  addon?: string
}

defineProps<Props>()
</script>

<template>
  <div class="flex input-group">
    <!-- メイン入力欄 (AtomsInput 等) -->
    <slot />

    <!-- 単位テキストアドオン -->
    <span v-if="addon" class="inline-flex shrink-0 items-center justify-center select-none addon">
      {{ addon }}
    </span>

    <!-- セレクトボックス等のカスタム連結 -->
    <div v-else-if="$slots.append" class="flex items-stretch append">
      <slot name="append" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.input-group {
  :deep(> *:not(.addon, .append)) {
    flex: 1;
    min-width: 0;
  }

  :deep(.form-control) {
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

  .addon {
    padding-block: 0.3em;
    padding-inline: 0.8em;
    border: var(--border-width-base) solid var(--color-border);
    border-left: none;
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;

    font-size: inherit;
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
    white-space: nowrap;

    background-color: color-mix(in srgb, var(--surface-bg-elevated) 70%, var(--color-border) 30%);
  }

  .append {
    :deep(.custom-select__value) {
      padding-inline: 0.8em;
      border-left: none;
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;

      &:focus,
      &:focus-visible,
      &.is-active {
        position: relative;
        z-index: 2;
        margin-left: calc(var(--border-width-base) * -1);
        border-left: var(--border-width-base) solid var(--theme-accent);
      }
    }

    :deep(.custom-select) {
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
