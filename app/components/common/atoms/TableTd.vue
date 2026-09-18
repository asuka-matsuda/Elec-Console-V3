<script setup lang="ts" generic="T extends Record<string, unknown> = Record<string, unknown>">
/**
 * TableTd
 * [Atoms] テーブルのデータセル（整列・幅指定・2段組サブテキスト対応）。
 * 単体でも、TableColumn 定義と連携させても動作するセマンティックな td コンポーネントです。
 */
import { computed } from 'vue'

import { useNoBreakWords } from '~/composables/useNoBreakWords'
import type { TableTdProps } from '~/types/components'

const props = withDefaults(defineProps<TableTdProps<T>>(), {
  column: undefined,
  width: undefined,
  minWidth: undefined,
  maxWidth: undefined,
  align: undefined,
  value: undefined,
  subValue: undefined,
  truncate: undefined,
  emptyFallback: undefined,
  title: undefined,
})

defineSlots<{
  default?(props: { value: unknown, subValue?: unknown }): unknown
}>()

// 改行禁止処理（フェッチはセルごとには行わず、適用関数のみ利用）
const { applyNoBreak } = useNoBreakWords()

// スタイル・プロパティのフォールバック解決
const effectiveAlign = computed(() => props.align ?? props.column?.align ?? 'left')
const effectiveWidth = computed(() => props.width ?? props.column?.width)
const effectiveMinWidth = computed(() => props.minWidth ?? props.column?.minWidth)
const effectiveMaxWidth = computed(() => props.maxWidth ?? props.column?.maxWidth ?? effectiveWidth.value)
const effectiveEmptyFallback = computed(() => props.emptyFallback ?? props.column?.emptyFallback ?? '-')

const isStacked = computed(() => Boolean(props.column?.subKey || (props.subValue !== undefined && props.subValue !== null && props.subValue !== '')))
const shouldTruncate = computed(() => {
  if (props.truncate !== undefined) return props.truncate
  if (props.column?.truncate !== undefined) return props.column.truncate

  // デフォルト: 2段組でなく、デフォルトスロットが渡されていない場合に省略表示を有効化
  return !isStacked.value
})

const isEmpty = computed(() => props.value === null || props.value === undefined || props.value === '')

const cellTitle = computed(() => {
  if (props.title !== undefined) return props.title

  // 省略表示が有効かつ値が存在する場合にツールチップとして全文を自動設定
  if (shouldTruncate.value && !isEmpty.value) {
    return String(props.value ?? '')
  }

  return undefined
})

/**
 * 表示用テキストのフォーマット（空値判定と改行禁止文字の適用）
 */
const formatValue = (val: unknown): string => {
  if (val === null || val === undefined || val === '') {
    return effectiveEmptyFallback.value
  }

  return String(applyNoBreak(val))
}

const formattedMainValue = computed(() => formatValue(props.value))
const formattedSubValue = computed(() => {
  if (props.subValue === null || props.subValue === undefined || props.subValue === '') {
    return ''
  }

  return String(applyNoBreak(props.subValue))
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
      width: effectiveWidth,
      minWidth: effectiveMinWidth,
      maxWidth: effectiveMaxWidth,
      textAlign: effectiveAlign,
    }"
    :title="cellTitle"
  >
    <slot :value="value" :sub-value="subValue">
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
