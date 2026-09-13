<script setup lang="ts" generic="T extends Record<string, unknown> = Record<string, unknown>">
/**
 * AtomsTableTd
 * [Atoms] テーブルのデータセル（2段組サブテキスト・整列・幅指定対応）。
 * AtomsTableTh と対になるセマンティックな td コンポーネントです。
 */
import type { TableColumn } from '~/types/components'

defineProps<{
  column: TableColumn<T>
  width?: string
  value?: unknown
  subValue?: unknown
}>()
</script>

<template>
  <td
    class="p-2 truncate align-middle"
    :style="{
      width: width || column.width,
      maxWidth: width || column.width,
      textAlign: column.align,
    }"
  >
    <slot :value="value" :sub-value="subValue">
      <div
        v-if="column.subKey"
        class="stacked-cell flex flex-col leading-tight min-w-0"
        :class="{
          'items-start text-left': !column.align || column.align === 'left',
          'items-center text-center': column.align === 'center',
          'items-end text-right': column.align === 'right',
        }"
      >
        <span class="main-text truncate w-full">
          {{ value ?? '-' }}
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
  font-variant-numeric: tabular-nums;
  color: var(--color-text-main);

  &:last-child {
    border-right: none;
  }

  .main-text {
    color: var(--color-text-main);
  }

  .sub-text {
    font-size: var(--font-size-2xs);
    color: var(--color-text-muted);
  }
}
</style>
