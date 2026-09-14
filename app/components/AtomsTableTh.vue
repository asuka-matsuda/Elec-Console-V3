<script setup lang="ts" generic="T extends Record<string, unknown>">
/**
 * AtomsTableTh
 * [Atoms] テーブルのヘッダーセル（ソート・整列機能付き）。
 */
import { computed } from 'vue'

import type { TableColumn } from '~/types/components'

const props = defineProps<{
  column: TableColumn<T>
  width?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc' | null
}>()

const emit = defineEmits<{
  (e: 'sort', column: TableColumn<T>): void
}>()

const isSorted = computed(() => Boolean(props.sortBy && props.sortBy === props.column.key && props.sortOrder !== null))
const isSortable = computed(() => props.column.sortable !== false)

const sortTitle = computed(() => {
  if (!isSortable.value) return undefined
  if (!isSorted.value) return 'クリックで昇順に並べ替え'

  return props.sortOrder === 'asc' ? 'クリックで降順に並べ替え' : 'クリックで元の並び順に戻す'
})

const sortIconName = computed(() => {
  if (!isSorted.value) return 'minus'

  return props.sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'
})

const handleClick = () => {
  if (isSortable.value) {
    emit('sort', props.column)
  }
}
</script>

<template>
  <th
    class="sticky top-0 p-2 align-middle"
    :class="{
      'is-sortable': isSortable,
      'is-sorted': isSorted,
    }"
    :style="{ width: width || column.width, textAlign: column.align }"
    :title="sortTitle"
    @click="handleClick"
  >
    <div
      class="inline-flex items-center gap-1 w-full"
      :class="{
        'justify-center': column.align === 'center',
        'justify-end': column.align === 'right',
      }"
    >
      {{ column.label }}
      <AtomsIcon
        v-if="isSortable"
        :name="sortIconName"
        size="sm"
        class="sort-icon"
        :class="{ 'is-active': isSorted }"
      />
    </div>
  </th>
</template>

<style scoped lang="scss">
th {
  z-index: var(--z-index-table-header);

  border-right: var(--border-width-base) solid var(--color-border);
  border-bottom: calc(var(--border-width-base) * 2) solid var(--color-border);

  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text-secondary);
  white-space: nowrap;

  background-color: var(--color-bg-hover);
  backdrop-filter: blur(var(--blur-md));

  &:last-child {
    border-right: none;
  }

  &.is-sortable {
    cursor: pointer;
    user-select: none;
    transition: var(--transition-colors);

    &:hover {
      color: var(--color-text-main);

      .sort-icon:not(.is-active) {
        opacity: 0.85;
      }
    }
  }

  &.is-sorted {
    border-bottom-color: var(--theme-accent);
    color: var(--color-text-main);
  }

  .sort-icon {
    flex-shrink: 0;
    color: var(--color-text-muted);
    opacity: 0.45;
    transition: var(--transition-fast);

    &.is-active {
      color: var(--theme-accent);
      opacity: 1;
    }
  }
}
</style>
