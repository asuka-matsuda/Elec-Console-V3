<script setup lang="ts">
/**
 * CellPhaseMeas
 * [Portal Molecules] 送電試験（Phase 2/3）用の相別測定値・電圧値入力セル。
 * 常時Inputを表示し、確定時はdisabled化。基準値・±10%許容範囲外の警告および判定バッジを表示します。
 */
import { computed } from 'vue'

import type { VoltageToleranceRange } from '~/utils/souden'
import { getPhase2Threshold, isVoltageOutOfRange } from '~/utils/souden'

const modelValue = defineModel<string | number>({ default: '' })

const props = withDefaults(
  defineProps<{
    label: string
    unit?: string
    status?: string | null
    disabled?: boolean
    threshold?: number
    haidenHoushiki?: string | null
    step?: string
    voltageRange?: VoltageToleranceRange
  }>(),
  {
    unit: 'MΩ',
    status: null,
    disabled: false,
    threshold: 1.0,
    haidenHoushiki: null,
    step: undefined,
    voltageRange: undefined,
  },
)

const emit = defineEmits<{
  (e: 'enter'): void
  (e: 'focus', event: FocusEvent): void
}>()

const resolvedStep = computed(() => props.step || (props.unit === 'MΩ' ? '0.01' : 'any'))

const effectiveThreshold = computed(() => {
  return props.haidenHoushiki ? getPhase2Threshold(props.haidenHoushiki) : (props.threshold ?? 0.1)
})

const isBelowThreshold = computed<boolean>(() => {
  if (props.unit !== 'MΩ') return false
  const raw = modelValue.value

  if (raw === '' || raw === null || raw === undefined) return false

  const num = typeof raw === 'number' ? raw : parseFloat(String(raw).trim())

  if (isNaN(num) || !isFinite(num)) return false

  return num < effectiveThreshold.value
})

const isOutOfVoltageRange = computed<boolean>(() => {
  if (props.unit !== 'V' || !props.voltageRange) return false

  return isVoltageOutOfRange(modelValue.value, props.voltageRange)
})

const hasError = computed(() => isBelowThreshold.value || isOutOfVoltageRange.value)

const placeholderText = computed(() => {
  if (props.unit === 'MΩ') return '100'
  if (props.unit === 'V' && props.voltageRange) return String(props.voltageRange.target)

  return undefined
})
</script>

<template>
  <div class="flex flex-col items-center gap-inline-gap text-2xs">
    <span class="cell-label">{{ label }}</span>

    <Input
      v-model="modelValue"
      type="number"
      :step="resolvedStep"
      inputmode="decimal"
      :placeholder="placeholderText"
      :clearable="false"
      :error="hasError"
      :disabled="disabled"
      class="w-[85px]"
      @focus="emit('focus', $event)"
      @keydown.enter.prevent="emit('enter')"
    />
    <span
      v-if="!disabled && isBelowThreshold"
      class="cell-warning-sub"
    >
      基準値未満です
    </span>
    <span
      v-if="!disabled && isOutOfVoltageRange"
      class="cell-warning-sub"
    >
      ±10%範囲外です
    </span>
    <Badge
      v-if="status"
      :id="status === 'OK' ? 'exam:pass' : 'exam:fail'"
    >
      {{ status }}
    </Badge>
  </div>
</template>

<style scoped>
.cell-label {
  font-size: var(--font-size-2xs);
  color: var(--color-text-secondary);
}

.cell-warning-sub {
  font-size: var(--font-size-2xs);
  font-weight: var(--font-weight-medium);
  line-height: 1.1;
  color: var(--color-status-danger);
  white-space: nowrap;
}
</style>
