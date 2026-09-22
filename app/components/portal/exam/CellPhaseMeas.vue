<script setup lang="ts">
/**
 * PhaseMeasCell
 * [Portal Molecules] 送電試験（Phase 2/3）用の相別測定値・電圧値セル。
 * 通常表示モード（相ラベル、数値+単位、判定バッジ）と手入力編集モードを提供します。
 */
import { computed } from 'vue'

const modelValue = defineModel<string | number>({ default: '' })

const props = withDefaults(
  defineProps<{
    label: string
    val?: number | null
    unit?: string
    status?: string | null
    isEditing?: boolean
    threshold?: number
    step?: string
  }>(),
  {
    val: null,
    unit: 'MΩ',
    status: null,
    isEditing: false,
    threshold: 1.0,
    step: undefined,
  },
)

const emit = defineEmits<{
  (e: 'enter'): void
  (e: 'focus', event: FocusEvent): void
}>()

const resolvedStep = computed(() => props.step || (props.unit === 'MΩ' ? '0.1' : 'any'))

const formattedValue = computed(() => {
  if (props.val == null) return '-'
  if (props.unit === 'MΩ') {
    return props.val >= 100 ? '100' : props.val.toFixed(1)
  }

  return String(props.val)
})

const statusClass = computed(() => {
  if (props.status === 'OK' || (props.val != null && props.status == null && props.threshold != null && props.unit === 'MΩ' && props.val >= props.threshold)) {
    return 'is-ok'
  }
  if (props.status === 'NG' || (props.val != null && props.status == null && props.threshold != null && props.unit === 'MΩ' && props.val < props.threshold)) {
    return 'is-ng'
  }
  if (props.val != null && props.unit !== 'MΩ') {
    return 'is-active'
  }

  return ''
})
</script>

<template>
  <div class="flex flex-col items-center gap-1 text-2xs">
    <span class="cell-label">{{ label }}</span>

    <Input
      v-if="isEditing"
      v-model="modelValue"
      type="number"
      :step="resolvedStep"
      inputmode="decimal"
      :placeholder="unit === 'MΩ' ? '100' : undefined"
      :addon="unit"
      class="w-[85px]"
      @focus="emit('focus', $event)"
      @keydown.enter.prevent="emit('enter')"
    />

    <template v-else>
      <div class="flex items-baseline gap-0.5">
        <span class="cell-val" :class="statusClass">
          {{ formattedValue }}
        </span>
        <span v-if="val != null" class="cell-unit">{{ unit }}</span>
      </div>

      <Badge
        v-if="status"
        :id="status === 'OK' ? 'exam:pass' : 'exam:fail'"
      >
        {{ status }}
      </Badge>
    </template>
  </div>
</template>

<style scoped>
.cell-label,
.cell-unit {
  font-size: var(--font-size-2xs);
  color: var(--color-text-secondary);
}

.cell-val {
  font-family: var(--font-mono);
  color: var(--color-text-main);
}

.cell-val.is-ok {
  color: var(--color-status-success);
}

.cell-val.is-ng {
  color: var(--color-status-danger);
}

.cell-val.is-active {
  color: var(--color-category-tool);
}
</style>
