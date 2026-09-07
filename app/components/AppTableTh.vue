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
      <span class="c-table__th-text">{{ column.label }}</span>
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

  border-right: var(--border-width-base) solid var(--color-border);
  border-bottom: calc(var(--border-width-base) * 2) solid var(--color-border);

  color: var(--color-text-muted);

  background-color: var(--surface-bg-elevated);
  backdrop-filter: blur(var(--blur-md));

  &:last-child {
    border-right: none;
  }

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

    gap: 4px;
    width: 100%;
    white-space: nowrap;
  }

  &[style*="text-align: center"] .c-table__th-inner {
    justify-content: center;
  }

  .c-table__th-text {
    white-space: nowrap;
  }

  .c-table__sort-icon {
    flex-shrink: 0;
    color: var(--color-text-muted);
    transition: all var(--duration-fast) var(--ease-base);

    &.is-active {
      color: var(--theme-accent);
      opacity: 1;
    }

    &.is-inactive {
      overflow: hidden;
      width: 0;
      margin-left: -4px;
      opacity: 0;
    }
  }

  &:hover .c-table__sort-icon.is-inactive {
    width: 12px;
    margin-left: 0;
    opacity: 0.5;
  }
}
</style>
