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
  <div class="flex flex-wrap items-center gap-2 tabs">
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
  </div>
</template>

<style scoped lang="scss">
.tabs__item {
  --glow-color: var(--theme-accent);

  cursor: pointer;
  user-select: none;

  padding: 0.4em 0.9em;
  border: var(--border-width-base) solid var(--color-border);
  border-radius: var(--radius-sm);

  font-size: inherit;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);

  transition: var(--transition-interactive);

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &:not(:disabled) {
    &:is(:hover, :focus-visible):not(.is-active) {
      transform: translateY(-1px);
      border-color: color-mix(in srgb, var(--glow-color) 60%, transparent);
      color: var(--color-text-main);
      background-color: var(--color-bg-hover);
    }

    &:active {
      transform: translateY(0);
      border-color: var(--glow-color);
    }

    &.is-active {
      border-color: var(--glow-color);
      color: var(--glow-color);
      text-shadow: var(--text-glow-sm);
    }
  }
}
</style>
