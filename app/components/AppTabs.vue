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
  @include click-enabled;
  @include text-desc("md", "medium");

  position: relative;

  display: flex;
  gap: var(--space-2);
  align-items: center;
  justify-content: center;

  padding: var(--space-2) var(--space-4);

  color: var(--color-text-secondary);

  @include border-base;
  @include state-base;

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
    @include disabled;
  }

  // 2. 有効状態
  &:not(:disabled) {
    &:is(:hover, :focus-visible):not(.is-active) {
      transform: translateY(-2px);
      color: var(--color-text-main);

      @include state-hover;
    }

    &:active {
      @include state-active(var(--theme-accent));
    }

    &.is-active {
      color: var(--theme-accent);

      @include state-active(var(--theme-accent));
      @include cyber-text-glow;
    }
  }
}
</style>
