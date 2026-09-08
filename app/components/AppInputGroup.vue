<script setup lang="ts">
/**
 * AppInputGroup
 * Input と Select やテキストアドオンを連結して表示するためのレイアウトコンポーネント。
 */
withDefaults(
  defineProps<{
    size?: 'sm' | 'md'
  }>(),
  {
    size: 'md',
  },
)
</script>

<template>
  <div :class="['input-group', `input-group--${size}`]">
    <slot />
    <div v-if="$slots.append" class="input-group__append">
      <slot name="append" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.input-group {
  display: flex;

  :deep(> *:not(.input-group__append)) {
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

  &__append {
    display: flex;

    :deep(.input-addon) {
      user-select: none;

      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;

      padding-block: 0.3em;
      padding-inline: 0.8em;
      border: var(--border-width-base) solid var(--color-border);
      border-left: none;
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;

      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-secondary);
      white-space: nowrap;

      background-color: color-mix(in srgb, var(--surface-bg-elevated) 70%, var(--color-border) 30%);
    }

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

  &--sm {
    :deep(.input-addon) {
      padding-inline: 0.6em;
      font-size: var(--font-size-xs);
    }
  }
}
</style>
