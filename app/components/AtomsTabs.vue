<script setup lang="ts" generic="T extends string | number">
/**
 * AtomsTabs
 * [Atoms] タブ切り替えのための最小UIコンポーネント。垂直方向の配置やグリッド配置にも対応しています。
 */
import type { TabOption } from '~/types/components'

const model = defineModel<T>()

withDefaults(
  defineProps<{
    options: TabOption<T>[]
    vertical?: boolean
    grid?: boolean
  }>(),
  {
    vertical: false,
    grid: false,
  },
)

const selectTab = (option: TabOption<T>) => {
  if (option.disabled) return
  model.value = option.value
}
</script>

<template>
  <div
    class="flex gap-2 tabs"
    :class="{
      'flex-col': vertical,
      'tabs--grid': grid,
      'flex-wrap items-center': !vertical && !grid,
    }"
  >
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      class="relative flex items-center justify-center gap-2 py-2 px-4 tabs__item"
      :class="{
        'is-active': model === option.value,
      }"
      :disabled="option.disabled"
      @click="selectTab(option)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.tabs {
  &--grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}

.tabs__item {
  --glow-color: var(--theme-accent);

  cursor: pointer;
  user-select: none;

  z-index: 1;

  border: var(--border-width-base) solid var(--color-border);
  border-radius: var(--radius-sm);

  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);

  transition: var(--transition-base);

  .tabs--grid & {
    width: 100%;
    padding-inline: 0;
  }

  .tabs--vertical & {
    justify-content: flex-start;
    width: 100%;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &:not(:disabled) {
    &:is(:hover, :focus-visible):not(.is-active) {
      transform: translateY(-2px);

      border-color: var(--glow-color);

      color: var(--color-text-main);

      box-shadow: var(--shadow-glow-hover);

      transition: var(--transition-glow);
    }

    &:active {
      border-color: var(--glow-color);
      box-shadow: var(--shadow-glow-active);
      transition: var(--transition-glow);
    }

    &.is-active {
      border-color: var(--glow-color);

      color: var(--glow-color);
      text-shadow: var(--text-glow-md);

      box-shadow: var(--shadow-glow-active);

      transition: var(--transition-glow);
    }
  }
}
</style>
