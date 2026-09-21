<script setup lang="ts">
/**
 * TableTd
 * [Atoms] テーブルのデータセル（整列・2段組サブテキスト・空値フォールバック対応）。
 * 列幅はテーブルの <colgroup> が一元管理するため、インライン幅指定を排除し高効率に描画します。
 */
import { computed } from 'vue'

import { useNoBreakWords } from '~/composables/useNoBreakWords'
import type { TableTdProps } from '~/types/components'

const props = withDefaults(defineProps<TableTdProps>(), {
  value: undefined,
  subValue: undefined,
  align: 'left',
  truncate: undefined,
  emptyFallback: '-',
  title: undefined,
})

defineSlots<{
  default?(props: { value: unknown, subValue?: unknown }): unknown
}>()

// 改行禁止処理
const { applyNoBreak } = useNoBreakWords()

const isStacked = computed(() => props.subValue !== undefined && props.subValue !== null && props.subValue !== '')
const shouldTruncate = computed(() => props.truncate ?? !isStacked.value)
const isEmpty = computed(() => props.value === null || props.value === undefined || props.value === '')

const cellTitle = computed(() => {
  if (props.title !== undefined) return props.title

  if (shouldTruncate.value && !isEmpty.value) {
    return String(props.value ?? '')
  }

  return undefined
})

const formatValue = (val: unknown, fallback = props.emptyFallback): string => {
  if (val === null || val === undefined || val === '') {
    return fallback
  }

  return String(applyNoBreak(val))
}

const formattedMainValue = computed(() => formatValue(props.value))
const formattedSubValue = computed(() => formatValue(props.subValue, ''))
</script>

<template>
  <td
    class="p-2 align-middle"
    :class="[
      align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left',
      {
        'is-truncate': shouldTruncate && !$slots.default,
        'is-empty': isEmpty,
      },
    ]"
    :title="cellTitle"
  >
    <slot :value="value" :sub-value="subValue">

      <div
        v-if="isStacked"
        class="stacked-cell flex flex-col gap-0.5 min-w-0"
        :class="align === 'center' ? 'items-center' : align === 'right' ? 'items-end' : 'items-start'"
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

  // 2段組セルのレイアウト制御（スロット経由の描画にも統一適用）
  :deep(.stacked-cell),
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
