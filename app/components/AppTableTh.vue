<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed } from 'vue'

import type { TableColumn } from '~/types/components'

const props = defineProps<{
  column: TableColumn<T>
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}>()

const emit = defineEmits<{
  (e: 'sort', column: TableColumn<T>): void
}>()

const isSorted = computed(() => props.sortBy === props.column.key)

const sortTitle = computed(() => {
  if (!props.column.sortable) return undefined
  if (!isSorted.value) return 'クリックで並び替え'

  return props.sortOrder === 'asc' ? 'クリックで降順' : 'クリックで昇順'
})

const sortIconName = computed(() => {
  if (!isSorted.value) return 'minus'

  return props.sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'
})

const handleClick = () => {
  if (props.column.sortable) {
    emit('sort', props.column)
  }
}
</script>

<template>
  <th
    :class="{
      'is-sortable': column.sortable,
      'is-sorted': isSorted,
    }"
    :style="{ width: column.width, textAlign: column.align }"
    :title="sortTitle"
    @click="handleClick"
  >
    <div class="c-table__th-inner">
      <span>{{ column.label }}</span>
      <AppIcon
        v-if="column.sortable"
        :name="sortIconName"
        size="sm"
        class="c-table__sort-icon"
        :class="{ 'is-active': isSorted, 'is-inactive': !isSorted }"
      />
    </div>
  </th>
</template>

<style scoped lang="scss">
th {
  @include text-label;

  position: sticky;
  z-index: var(--z-index-table-header);
  top: 0;

  border-bottom-width: calc(var(--border-width-base) * 2);

  color: var(--color-text-muted);

  backdrop-filter: blur(var(--blur-md));

  &.is-sortable {
    @include click-enabled;

    transition: color var(--duration-fast) var(--ease-base);

    &:hover {
      color: var(--color-text-main);
    }
  }

  &.is-sorted {
    border-bottom-color: var(--theme-accent);
    color: var(--color-text-main);
  }

  .c-table__th-inner {
    @include flex-start-center($is-inline: true);

    gap: var(--space-1);
  }

  .c-table__sort-icon {
    color: var(--color-text-muted);

    &.is-active {
      color: var(--theme-accent);
    }

    &.is-inactive {
      opacity: 0.3;
    }
  }
}
</style>
