<script setup lang="ts">
/**
 * KanaFilter
 * [Reference] 五十音（あ行〜わ行他）による絞り込み機能を提供する用語集専用フィルターコンポーネント。
 */
import { computed } from 'vue'

import type { KanaFilterProps } from '~/types/components'
import type { KanaRowKey } from '~/utils/kana'

const selectedKanas = defineModel<KanaRowKey[]>({ default: () => [] })

const props = defineProps<KanaFilterProps>()

const KANA_ROWS: { label: string, value: KanaRowKey }[] = [
  { label: 'あ', value: 'a' },
  { label: 'か', value: 'k' },
  { label: 'さ', value: 's' },
  { label: 'た', value: 't' },
  { label: 'な', value: 'n' },
  { label: 'は', value: 'h' },
  { label: 'ま', value: 'm' },
  { label: 'や', value: 'y' },
  { label: 'ら', value: 'r' },
  { label: 'わ他', value: 'w' },
]

const toggleRow = (val: KanaRowKey) => {
  const current = selectedKanas.value

  selectedKanas.value = current.includes(val)
    ? current.filter(v => v !== val)
    : [...current, val]
}

const disabledRows = computed(() => {
  if (!props.availableRows) return new Set<KanaRowKey>()
  const rows = props.availableRows
  const hasW = rows.has('w') || rows.has('other')

  return new Set(
    KANA_ROWS
      .map(k => k.value)
      .filter(k => (k === 'w' ? !hasW : !rows.has(k))),
  )
})
</script>

<template>
  <div class="grid grid-cols-5 gap-1">
    <button
      v-for="kana in KANA_ROWS"
      :key="kana.value"
      type="button"
      class="flex items-center justify-center h-7 kana-btn"
      :class="{ 'is-active': selectedKanas.includes(kana.value) }"
      :disabled="disabledRows.has(kana.value)"
      @click="toggleRow(kana.value)"
    >
      {{ kana.label }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.kana-btn {
  cursor: pointer;
  user-select: none;

  border: var(--border-width-base) solid var(--color-border);

  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);

  background-color: var(--surface-bg-elevated);

  transition: var(--transition-interactive);

  &:hover:not(:disabled) {
    color: var(--color-text-main);
    background-color: var(--color-bg-hover);
  }

  &:active:not(:disabled) {
    transform: scale(0.96);
  }

  &.is-active {
    border-color: var(--theme-accent);
    color: var(--theme-accent);
    background-color: color-mix(in srgb, var(--theme-accent) 15%, transparent);
  }

  @include state-disabled;
}
</style>
