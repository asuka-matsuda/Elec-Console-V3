<script setup lang="ts" generic="T = Record<string, unknown>">
/**
 * TableTh
 * [Atoms] テーブルのヘッダーセル（ソート・整列・カスタムスロット・キーボード操作対応）。
 * 列幅はテーブルの <colgroup> が一元管理するため、インライン幅指定を排除し高効率に描画します。
 */
import { computed } from 'vue'

import type { TableColumn, TableThProps } from '~/types/components'

const props = withDefaults(defineProps<TableThProps<T>>(), {
  sortBy: undefined,
  sortOrder: 'asc',
  title: undefined,
})

const emit = defineEmits<{
  (e: 'sort', column: TableColumn<T>): void
}>()

defineSlots<{
  default?(props: { column: TableColumn<T> }): unknown
}>()

const isSortable = computed(() => props.column.sortable !== false && Boolean(props.column.key))
const isSorted = computed(() => Boolean(props.sortBy && props.sortBy === props.column.key && props.sortOrder !== null))

const sortTitle = computed(() => {
  if (props.title) return props.title
  if (!isSortable.value) return undefined
  if (!isSorted.value) return 'クリックで昇順に並び替え'

  return props.sortOrder === 'asc' ? 'クリックで降順に並び替え' : 'クリックで元の並び順に戻す'
})

const sortIconName = computed(() => {
  if (!isSorted.value) return 'chevrons-up-down'

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
    class="sticky top-0 z-table-header p-item-gap align-middle"
    :class="{
      'is-sortable': isSortable,
      'is-sorted': isSorted,
    }"
    :title="sortTitle"
    :tabindex="isSortable ? 0 : undefined"
    @click="handleClick"
    @keydown.enter.prevent="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <div
      class="flex items-center gap-inline-gap w-full min-w-0 header-content"
      :class="{
        'justify-center': column.align === 'center',
        'justify-end': column.align === 'right',
        'justify-start': !column.align || column.align === 'left',
      }"
    >
      <span class="header-label">
        <slot :column="column">
          {{ column.label }}
        </slot>
      </span>
      <Icon
        v-if="isSortable"
        :name="sortIconName"
        size="sm"
        class="shrink-0 sort-icon"
        :class="{ 'is-active': isSorted }"
      />
    </div>
  </th>
</template>

<style scoped lang="scss">
th {
  // table-cell 仕様に則り height で行高さを担保
  height: var(--table-cell-min-height, 36px);
  border-right: var(--border-width-base) solid var(--color-border);
  border-bottom: var(--border-width-thick) solid var(--color-border);

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

  // ソート可能セルのインタラクション
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

    &:focus-visible {
      color: var(--color-text-main);
      outline: none;
      box-shadow: inset 0 0 0 var(--border-width-thick) var(--theme-accent);
    }
  }

  // ソート適用中のハイライト
  &.is-sorted {
    border-bottom-color: var(--theme-accent);
    color: var(--color-text-main);
  }

  // ヘッダーラベルのテキスト省略
  .header-label {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  // ソートインジケーターアイコン
  .sort-icon {
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
