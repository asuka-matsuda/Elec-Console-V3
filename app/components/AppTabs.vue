<script setup lang="ts" generic="T extends string | number">
/**
 * AppTabs
 * タブ切り替えのためのコンポーネントです。垂直方向の配置やグリッド配置にも対応しています。
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
    class="c-tabs"
    :class="{
      'c-tabs--vertical': vertical,
      'c-tabs--grid': grid,
    }"
  >
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      class="c-tabs__item"
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
.c-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;

  &--grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: var(--space-2);
  }

  &--vertical {
    display: flex;
    flex-direction: column;
  }
}

.c-tabs__item {
  cursor: pointer;
  user-select: none;

  position: relative;
  z-index: 1;

  display: flex;
  gap: var(--space-2);
  align-items: center;
  justify-content: center;

  padding: var(--space-2) var(--space-4);
  border: var(--border-width-base) solid var(--color-border);
  border-radius: var(--radius-sm);

  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-base);
  color: var(--color-text-secondary);

  transition: var(--transition-base);

  .c-tabs--grid & {
    width: 100%;
    padding-right: 0;
    padding-left: 0;
  }

  .c-tabs--vertical & {
    justify-content: flex-start;
    width: 100%;
  }

  // 1. 無効状態
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  // 2. 有効状態
  &:not(:disabled) {
    &:is(:hover, :focus-visible):not(.is-active) {

      --glow-color: var(--theme-accent);

      transform: translateY(-2px);

      border-color: var(--theme-accent);

      color: var(--color-text-main);

      box-shadow: var(--shadow-glow-hover);

      transition: var(--transition-glow);
    }

    &:active {
      --glow-color: var(--theme-accent);

      border-color: var(--theme-accent);
      box-shadow: var(--shadow-glow-active);
      transition: var(--transition-glow);
    }

    &.is-active {
      --glow-color: var(--theme-accent);

      border-color: var(--theme-accent);

      color: var(--theme-accent);
      text-shadow: var(--text-glow-md);

      box-shadow: var(--shadow-glow-active);

      transition: var(--transition-glow);
    }
  }
}
</style>
