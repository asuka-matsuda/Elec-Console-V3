<script setup lang="ts" generic="T extends string | number">
/**
 * AtomsTabs
 * [Atoms] タブ切り替えのための最小UIコンポーネント。
 * 下線スタイル（underline）とセグメントコントロール風のピルスタイル（pill）に対応します。
 */
import type { TabOption } from '~/types/components'

const model = defineModel<T>()

withDefaults(
  defineProps<{
    options: TabOption<T>[]
    variant?: 'underline' | 'pill'
  }>(),
  {
    variant: 'underline',
  },
)

const selectTab = (option: TabOption<T>) => {
  if (option.disabled) return
  model.value = option.value
}
</script>

<template>
  <nav
    class="flex flex-wrap items-center gap-1 tabs"
    :class="`tabs--${variant}`"
  >
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      class="relative z-[1] flex items-center justify-center gap-2 tabs__item"
      :class="{
        'is-active': model === option.value,
      }"
      :disabled="option.disabled"
      @click="selectTab(option)"
    >
      <slot name="tab" :option="option" :is-active="model === option.value">
        {{ option.label }}
      </slot>
    </button>
  </nav>
</template>

<style scoped lang="scss">
.tabs {
  &.tabs--underline {
    border-bottom: var(--border-width-base) solid var(--color-border);

    .tabs__item {
      margin-bottom: -1px;
      padding-block: 0.5em;
      padding-inline: 0.9em;
      border: none;
      border-bottom: 2px solid transparent;

      background-color: transparent;

      &:not(:disabled) {
        &:is(:hover, :focus-visible):not(.is-active) {
          color: var(--color-text-main);
          background-color: var(--color-bg-hover);
        }

        &.is-active {
          border-bottom-color: var(--theme-accent);

          font-weight: var(--font-weight-semibold);
          color: var(--color-text-main);

          background-color: transparent;
          box-shadow: none;
        }
      }
    }
  }

  &.tabs--pill {
    display: inline-flex;

    padding: 0.2em;
    border: var(--border-width-base) solid var(--color-border);

    background-color: var(--surface-bg-elevated);
    box-shadow: var(--shadow-sink);

    .tabs__item {
      padding: 0.3em 0.8em;
      border: var(--border-width-base) solid transparent;

      &:not(:disabled) {
        &:hover:not(.is-active) {
          color: var(--color-text-main);
          background-color: var(--color-bg-hover);
        }

        &:focus-visible {
          outline: none;
          box-shadow: var(--shadow-glow-focus);
        }

        &.is-active {
          border-color: var(--color-border);

          font-weight: var(--font-weight-semibold);
          color: var(--color-text-main);

          background-color: var(--surface-bg-solid);
          box-shadow: var(--shadow-elevation-sm);
        }
      }
    }
  }
}

.tabs__item {
  cursor: pointer;
  user-select: none;

  font-size: inherit;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);

  transition: var(--transition-interactive);

  @include state-disabled;
}
</style>
