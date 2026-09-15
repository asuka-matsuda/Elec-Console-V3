<script setup lang="ts" generic="T extends string | number">
/**
 * AtomsTabs
 * [Atoms] タブ切り替えのための最小UIコンポーネント。
 */
import type { TabOption } from '~/types/components'

const model = defineModel<T>()

defineProps<{
  options: TabOption<T>[]
}>()

const selectTab = (option: TabOption<T>) => {
  if (option.disabled) return
  model.value = option.value
}
</script>

<template>
  <nav class="flex flex-wrap items-center gap-1 tabs">
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
  border-bottom: var(--border-width-base) solid var(--color-border);
}

.tabs__item {
  cursor: pointer;
  user-select: none;

  position: relative;

  margin-bottom: -1px;
  padding-block: 0.5em;
  padding-inline: 0.9em;
  border: none;
  border-bottom: 2px solid transparent;

  font-size: inherit;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);

  background-color: transparent;

  transition: var(--transition-interactive);

  &:not(:disabled) {
    &:is(:hover, :focus-visible):not(.is-active) {
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
      color: var(--color-text-main);
      background-color: var(--color-bg-hover);
    }

    &.is-active {
      border-bottom-color: var(--theme-accent);
      border-radius: 0;

      font-weight: var(--font-weight-semibold);
      color: var(--color-text-main);

      background-color: transparent;
      box-shadow: none;
    }
  }

  @include state-disabled;
}
</style>
