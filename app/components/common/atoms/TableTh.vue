<script setup lang="ts" generic="T = unknown">
/**
 * TableTh
 * [Atoms] テーブルのヘッダーセル（ソート・整列・カスタムスロット・キーボード操作対応）。
 */
import { computed } from 'vue'

import type { TableColumn, TableThProps } from '~/types/components'

const props = withDefaults(defineProps<TableThProps<T>>(), {
  column: undefined,
  sortKey: undefined,
  label: undefined,
  width: undefined,
  minWidth: undefined,
  maxWidth: undefined,
  align: undefined,
  sortable: undefined,
  sortBy: undefined,
  sortOrder: 'asc',
  title: undefined,
})

const emit = defineEmits<{
  (e: 'sort', column: TableColumn<T>): void
}>()

defineSlots<{
  default?(props: { column?: TableColumn<T> }): unknown
}>()

const effectiveKey = computed(() => props.sortKey ?? props.column?.key ?? '')
const effectiveLabel = computed(() => props.label ?? props.column?.label ?? '')
const effectiveAlign = computed(() => props.align ?? props.column?.align ?? 'left')
const effectiveWidth = computed(() => props.width ?? props.column?.width)
const effectiveMinWidth = computed(() => props.minWidth ?? props.column?.minWidth)
const effectiveMaxWidth = computed(() => props.maxWidth ?? props.column?.maxWidth ?? effectiveWidth.value)

const isSortable = computed(() => {
  if (props.sortable !== undefined) return props.sortable

  return props.column?.sortable !== false && Boolean(effectiveKey.value)
})

const isSorted = computed(() => Boolean(props.sortBy && props.sortBy === effectiveKey.value && props.sortOrder !== null))

const sortTitle = computed(() => {
  if (props.title) return props.title
  if (!isSortable.value) return effectiveLabel.value || undefined
  if (!isSorted.value) return 'クリックで昇順に並び替え'

  return props.sortOrder === 'asc' ? 'クリックで降順に並び替え' : 'クリックで元の並び順に戻す'
})

const sortIconName = computed(() => {
  if (!isSorted.value) return 'chevrons-up-down'

  return props.sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'
})

// column 未指定時（Props個別指定時）のフォールバック用 Column 定義
const effectiveColumn = computed<TableColumn<T>>(() => {
  if (props.column) return props.column

  return {
    key: String(effectiveKey.value),
    label: effectiveLabel.value,
    align: effectiveAlign.value,
    width: effectiveWidth.value,
    minWidth: effectiveMinWidth.value,
    maxWidth: effectiveMaxWidth.value,
    sortable: isSortable.value,
  }
})

const handleClick = () => {
  if (isSortable.value) {
    emit('sort', effectiveColumn.value)
  }
}
</script>

<template>
  <th
    class="sticky top-0 z-table-header p-2 align-middle"
    :class="{
      'is-sortable': isSortable,
      'is-sorted': isSorted,
    }"
    :style="{
      width: effectiveWidth,
      minWidth: effectiveMinWidth,
      maxWidth: effectiveMaxWidth,
      textAlign: effectiveAlign,
    }"
    :title="sortTitle"
    :tabindex="isSortable ? 0 : undefined"
    @click="handleClick"
    @keydown.enter.prevent="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <div
      class="header-content inline-flex items-center gap-1 w-full min-w-0"
      :class="{
        'justify-center': effectiveAlign === 'center',
        'justify-end': effectiveAlign === 'right',
      }"
    >
      <span class="header-label">
        <slot :column="column">
          {{ effectiveLabel }}
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
