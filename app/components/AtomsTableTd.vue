<script setup lang="ts" generic="T extends Record<string, unknown> = Record<string, unknown>">
/**
 * AtomsTableTd
 * [Atoms] テーブルのデータセル（2段組サブテキスト・整列・幅指定対応）。
 * AtomsTableTh と対になるセマンティックな td コンポーネントです。
 */
import { onMounted } from 'vue'

import { useNoBreakWords } from '~/composables/useNoBreakWords'
import type { TableColumn } from '~/types/components'

defineProps<{
  column: TableColumn<T>
  width?: string
  value?: unknown
  subValue?: unknown
}>()

const { applyNoBreak, fetchWords } = useNoBreakWords()

onMounted(() => {
  fetchWords()
})

const formatDisplayText = (val: unknown): unknown => {
  return applyNoBreak(val)
}
</script>

<template>
  <td
    class="py-1.5 px-2 align-middle"
    :class="{
      truncate: !column.subKey && !$slots.default,
    }"
    :style="{
      width: width || column.width,
      maxWidth: width || column.width,
      textAlign: column.align,
    }"
  >
    <slot :value="value" :sub-value="subValue">
      <div
        v-if="column.subKey"
        class="stacked-cell flex flex-col gap-0.5 leading-tight min-w-0"
        :class="{
          'items-start text-left': !column.align || column.align === 'left',
          'items-center text-center': column.align === 'center',
          'items-end text-right': column.align === 'right',
        }"
      >
        <span class="main-text w-full">
          {{ formatDisplayText(value) ?? '-' }}
        </span>
        <span
          v-if="subValue"
          class="sub-text truncate w-full"
        >
          {{ subValue }}
        </span>
      </div>
      <template v-else>
        {{ value }}
      </template>
    </slot>
  </td>
</template>

<style scoped lang="scss">
td {
  border-right: var(--border-width-base) solid var(--color-border);
  border-bottom: var(--border-width-base) solid
    color-mix(in srgb, var(--color-border) 70%, var(--color-text-muted) 30%);

  font-family: var(--font-mono);
  font-size: var(--font-size-xs, 12px);
  font-weight: var(--font-weight-normal, 400);
  font-variant-numeric: tabular-nums;
  line-height: 1.3;
  color: var(--color-text-main);

  &:last-child {
    border-right: none;
  }

  .main-text {
    font-size: inherit;
    font-weight: var(--font-weight-normal, 400);
    line-height: inherit;
    color: var(--color-text-main);
    word-break: auto-phrase;
    line-break: strict;
    overflow-wrap: anywhere;
    white-space: normal;
  }

  .sub-text {
    font-size: var(--font-size-2xs, 10px);
    line-height: 1.2;
    color: var(--color-text-muted);
  }

  :deep(strong),
  :deep(b) {
    font-weight: var(--font-weight-normal, 400);
  }

  :deep(.btn) {
    min-height: 2.2em;
    padding-block: 0.25em;
    padding-inline: 0.8em;

    font-size: var(--font-size-xs, 12px);
    font-weight: var(--font-weight-normal, 400);
    letter-spacing: normal;
  }
}
</style>
