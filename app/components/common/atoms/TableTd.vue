<script setup lang="ts" generic="T = unknown">
/**
 * TableTd
 * [Atoms] テーブルのデータセル（整列・2段組サブテキスト・空値フォールバック対応）。
 * 列幅はテーブルの <colgroup> が一元管理するため、インライン幅指定を排除し高効率に描画します。
 */
import { computed } from 'vue'

import { useNoBreakWords } from '~/composables/useNoBreakWords'
import type { TableTdProps } from '~/types/components'

const props = withDefaults(defineProps<TableTdProps<T>>(), {
  column: undefined,
  row: undefined,
  value: undefined,
  subValue: undefined,
  align: undefined,
  truncate: undefined,
  emptyFallback: undefined,
  title: undefined,
})

defineSlots<{
  default?(props: { value: unknown, subValue?: unknown }): unknown
}>()

// 改行禁止処理
const { applyNoBreak } = useNoBreakWords()

// ネストパス対応のセーフアクセサー
const getValueByPath = (obj: unknown, path: string): unknown => {
  if (!obj || typeof obj !== 'object') return undefined
  const record = obj as Record<string, unknown>

  if (path in record) return record[path]

  if (path.includes('.')) {
    const parts = path.split('.')
    let current: unknown = record

    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined
      }
      current = (current as Record<string, unknown>)[part]
    }

    return current
  }

  return undefined
}

// セル値の解決（直接渡された value を優先、なければ row と column.key から自動解決）
const resolvedValue = computed(() => {
  if (props.value !== undefined) return props.value
  if (!props.row || !props.column?.key) return undefined

  return getValueByPath(props.row, String(props.column.key))
})

// サブ値の解決（直接渡された subValue を優先、なければ row と column.subKey から自動解決）
const resolvedSubValue = computed(() => {
  if (props.subValue !== undefined) return props.subValue
  if (!props.row || !props.column?.subKey) return undefined

  return getValueByPath(props.row, String(props.column.subKey))
})

const effectiveAlign = computed(() => props.align ?? props.column?.align ?? 'left')
const effectiveEmptyFallback = computed(() => props.emptyFallback ?? props.column?.emptyFallback ?? '-')

const isStacked = computed(() => Boolean(props.column?.subKey || (resolvedSubValue.value !== undefined && resolvedSubValue.value !== null && resolvedSubValue.value !== '')))
const shouldTruncate = computed(() => {
  if (props.truncate !== undefined) return props.truncate
  if (props.column?.truncate !== undefined) return props.column.truncate

  return !isStacked.value
})

const isEmpty = computed(() => resolvedValue.value === null || resolvedValue.value === undefined || resolvedValue.value === '')

const cellTitle = computed(() => {
  if (props.title !== undefined) return props.title

  if (shouldTruncate.value && !isEmpty.value) {
    return String(resolvedValue.value ?? '')
  }

  return undefined
})

const formatValue = (val: unknown): string => {
  if (val === null || val === undefined || val === '') {
    return effectiveEmptyFallback.value
  }

  return String(applyNoBreak(val))
}

const formattedMainValue = computed(() => formatValue(resolvedValue.value))
const formattedSubValue = computed(() => {
  if (resolvedSubValue.value === null || resolvedSubValue.value === undefined || resolvedSubValue.value === '') {
    return ''
  }

  return String(applyNoBreak(resolvedSubValue.value))
})
</script>

<template>
  <td
    class="py-1.5 px-2 align-middle"
    :class="{
      'is-truncate': shouldTruncate && !$slots.default,
      'is-empty': isEmpty,
    }"
    :style="{
      textAlign: effectiveAlign,
    }"
    :title="cellTitle"
  >
    <slot :value="resolvedValue" :sub-value="resolvedSubValue">
      <!-- 2段組表示モード -->
      <div
        v-if="isStacked"
        class="stacked-cell flex flex-col gap-0.5 min-w-0"
        :class="{
          'items-start text-left': effectiveAlign === 'left',
          'items-center text-center': effectiveAlign === 'center',
          'items-end text-right': effectiveAlign === 'right',
        }"
      >
        <span class="main-text">
          {{ formattedMainValue }}
        </span>
        <span
          v-if="formattedSubValue"
          class="sub-text"
        >
          {{ formattedSubValue }}
        </span>
      </div>

      <!-- 通常1行表示モード -->
      <template v-else>
        {{ formattedMainValue }}
      </template>
    </slot>
  </td>
</template>

<style scoped lang="scss">
td {
  height: var(--table-cell-min-height, 36px);
  border-right: var(--border-width-base) solid var(--color-border);
  border-bottom: var(
    --table-cell-border-bottom,
    var(--border-width-base) solid color-mix(in srgb, var(--color-border) 70%, var(--color-text-muted) 30%)
  );

  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-normal, 400);
  font-variant-numeric: tabular-nums;
  line-height: var(--table-cell-line-height, 1.3);
  color: var(--color-text-main);

  // 日本語・電気用語の自然改行
  word-break: auto-phrase;
  line-break: strict;
  overflow-wrap: anywhere;

  &:last-child {
    border-right: none;
  }

  // 空値フォールバック表示時
  &.is-empty {
    color: var(--color-text-muted);
  }

  // 1行省略表示
  &.is-truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // 2段組セルのレイアウト制御
  .stacked-cell {
    line-height: var(--line-height-tight);

    .main-text {
      white-space: normal;
    }

    .sub-text {
      overflow: hidden;

      font-size: var(--font-size-2xs, 0.85em);
      line-height: var(--line-height-tight);
      color: var(--color-text-muted);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
