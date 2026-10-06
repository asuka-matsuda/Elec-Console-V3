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
  <nav class="tabs flex items-center gap-inline-gap overflow-x-auto" :class="[`tabs-${size}`, { 'is-disabled': disabled }]">
    <button v-for="item in items" :key="String(item.value)" type="button" class="tabs-item" :class="{ 'is-active': modelValue === item.value, 'is-disabled': disabled || item.disabled }" :disabled="disabled || item.disabled" @click="handleSelect(item)">
      <Icon v-if="item.icon" :name="item.icon" :size="iconSize" />
      <span>{{ item.label }}</span>
      <Badge v-if="item.badge !== undefined" size="sm">{{ item.badge }}</Badge>
    </button>
  </nav>
</template>

<style scoped lang="scss">
.tabs {
  border-radius: 0;

  &.is-disabled {
    @include state-disabled;
  }
}

.tabs-item {
  border-radius: 0;

  &.is-disabled {
    @include state-disabled;
  }
}

.tabs-sm {
  .tabs-item {
    padding: 0.35em 0.7em;
    font-size: var(--font-size-xs);
  }
}

.tabs-md {
  .tabs-item {
    padding: 0.5em 0.9em;
    font-size: var(--font-size-sm);
  }
}

.tabs-lg {
  .tabs-item {
    padding: 0.65em 1.1em;
    font-size: var(--font-size-base);
  }
}
</style>
