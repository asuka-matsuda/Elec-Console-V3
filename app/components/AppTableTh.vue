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
    <div
      class="table__th-inner"
      :class="{
        'is-align-center': column.align === 'center',
        'is-align-right': column.align === 'right',
      }"
    >
      <span class="table__th-text">{{ column.label }}</span>
      <AtomsIcon
        v-if="column.sortable"
        :name="sortIconName"
        size="sm"
        class="table__sort-icon"
        :class="{ 'is-active': isSorted, 'is-inactive': !isSorted }"
      />
    </div>
  </th>
</template>

<style scoped lang="scss">
th {
  position: sticky;
  z-index: var(--z-index-table-header);
  top: 0;

  border-right: var(--border-width-base) solid var(--color-border);
  border-bottom: calc(var(--border-width-base) * 2) solid var(--color-border);

  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text-secondary);

  background-color: var(--color-bg-hover);
  backdrop-filter: blur(var(--blur-md));

  &:last-child {
    border-right: none;
  }

  &.is-sortable {
    cursor: pointer;
    user-select: none;
    transition: color var(--duration-fast) var(--ease-base);

    &:hover {
      color: var(--color-text-main);
    }
  }

  &.is-sorted {
    border-bottom-color: var(--theme-accent);
    color: var(--color-text-main);
  }

  .table__th-inner {
    display: inline-flex;
    gap: 4px;
    align-items: center;

    width: 100%;

    white-space: nowrap;

    &.is-align-center {
      justify-content: center;
    }

    &.is-align-right {
      justify-content: flex-end;
    }
  }

  .table__th-text {
    white-space: nowrap;
  }

  .table__sort-icon {
    flex-shrink: 0;
    color: var(--color-text-muted);
    transition: var(--transition-fast);

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

  &:hover .table__sort-icon.is-inactive {
    width: 12px;
    margin-left: 0;
    opacity: 0.5;
  }
}
</style>
