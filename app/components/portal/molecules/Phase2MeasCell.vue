<script setup lang="ts">
/**
 * Phase2MeasCell
 * [Portal Molecules] フェーズ2（絶縁抵抗測定）用の相別測定値セル。
 * 通常表示モード（相ラベル、数値+MΩ単位、OK/NGバッジ）と手入力編集モード（相ラベル+MΩアドオン付Input）を提供します。
 */
const modelValue = defineModel<string | number>({ default: '' })

const props = withDefaults(
  defineProps<{
    label: string
    val?: number | null
    status?: string | null
    isEditing?: boolean
    threshold?: number
  }>(),
  {
    val: null,
    status: null,
    isEditing: false,
    threshold: 1.0,
  },
)

const emit = defineEmits<{
  (e: 'enter'): void
  (e: 'focus', event: FocusEvent): void
}>()

const formatMegValue = (v: number | null | undefined) => {
  if (v == null) return '-'

  return v >= 100 ? '100' : v.toFixed(1)
}

const statusClass = () => {
  if (props.status === 'OK' || (props.val != null && props.val >= props.threshold)) return 'is-ok'
  if (props.status === 'NG' || (props.val != null && props.val < props.threshold)) return 'is-ng'

  return ''
}
</script>

<template>
  <div class="flex flex-col items-center gap-1 text-2xs">
    <span class="cell-label">{{ label }}</span>

    <!-- 手入力編集モード -->
    <Input
      v-if="isEditing"
      v-model="modelValue"
      type="number"
      step="0.1"
      inputmode="decimal"
      placeholder="100"
      addon="MΩ"
      class="w-[85px]"
      @focus="emit('focus', $event)"
      @keydown.enter.prevent="emit('enter')"
    />

    <!-- 通常表示モード -->
    <template v-else>
      <div class="flex items-baseline gap-0.5">
        <span class="cell-val" :class="statusClass()">
          {{ formatMegValue(val) }}
        </span>
        <span v-if="val != null" class="cell-unit">MΩ</span>
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
</style>
