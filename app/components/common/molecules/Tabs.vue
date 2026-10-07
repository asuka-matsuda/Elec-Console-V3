<script setup lang="ts">
import { computed } from 'vue'

import type { IconSize, TabItem, TabsProps } from '~/types/components'

const props = withDefaults(defineProps<TabsProps>(), {
  items: () => [],
  size: 'md',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  'change': [value: string | number]
}>()

const iconSize = computed<IconSize>(() => {
  return props.size === 'lg' ? 'md' : 'sm'
})

const handleSelect = (item: TabItem) => {
  if (props.disabled || item.disabled || item.value === props.modelValue) return
  emit('update:modelValue', item.value)
  emit('change', item.value)
}
</script>

<template>
  <nav class="tabs flex gap-inline-gap overflow-x-auto" :class="[`tabs-${size}`, { 'is-disabled': disabled }]">
    <button v-for="item in items" :key="String(item.value)" type="button" class="tabs-item relative z-[1] inline-flex items-center justify-center gap-inline-gap" :class="{ 'is-active': modelValue === item.value, 'is-disabled': disabled || item.disabled }" :disabled="disabled || item.disabled" @click="handleSelect(item)">
      <Icon v-if="item.icon" :name="item.icon" :size="iconSize" />
      <span>{{ item.label }}</span>
      <Badge v-if="item.badge !== undefined" size="sm">{{ item.badge }}</Badge>
    </button>
  </nav>
</template>

<style scoped lang="scss">
.tabs {
  box-sizing: border-box;
  border-radius: 0;
  box-shadow: inset 0 -1px 0 var(--color-border);

  &.is-disabled {
    @include state-disabled;
  }
}

.tabs-item {
  box-sizing: border-box;
  height: 100%;
  margin-bottom: 0;
  border: none;
  border-radius: 0;

  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  white-space: nowrap;

  background: transparent;

  transition: var(--transition-interactive);

  @include state-interactive;

  &:hover:not(:disabled, .is-active) {
    color: var(--color-text-main);
    background:
      linear-gradient(
        to bottom,
        color-mix(in srgb, var(--color-overlay) 6%, transparent) 0%,
        transparent 100%
      );
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--shadow-glow-focus);
  }

  &.is-active {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-main);
    background:
      linear-gradient(
        to top,
        color-mix(in srgb, var(--theme-accent) 8%, transparent) 0%,
        transparent 70%
      );

    &::after {
      content: "";

      position: absolute;
      right: 0;
      bottom: 0;
      left: 0;

      height: var(--border-width-thick, 2px);

      background:
        linear-gradient(
          90deg,
          transparent 0%,
          var(--theme-accent) 20%,
          var(--theme-accent) 80%,
          transparent 100%
        );
      box-shadow: var(--shadow-glow-active);
    }
  }

  &.is-disabled {
    @include state-disabled;
  }
}

.tabs-sm {
  height: 32px;

  .tabs-item {
    padding: 0 var(--space-2);
    font-size: var(--font-size-xs);
  }
}

.tabs-md {
  height: 40px;

  .tabs-item {
    padding: 0 var(--space-3);
    font-size: var(--font-size-sm);
  }
}

.tabs-lg {
  height: 48px;

  .tabs-item {
    padding: 0 var(--space-4);
    font-size: var(--font-size-base);
  }
}
</style>
