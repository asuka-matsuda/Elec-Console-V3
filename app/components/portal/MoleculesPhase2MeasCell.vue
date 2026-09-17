<script setup lang="ts">
/**
 * PortalMoleculesPhase2MeasCell
 * [Portal Molecules] フェーズ2（絶縁抵抗測定）用の相別測定値セルコンポーネント。
 * 通常表示モード（相ラベル、数値+単位、OK/NGバッジ）と手入力編集モード（相ラベル+MΩアドオン付Input）を提供します。
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
  if (v === null || v === undefined) return '-'
  if (v >= 100) return '100'

  return v.toFixed(1)
}

const isOk = () => {
  return props.status === 'OK' || (props.val !== null && props.val !== undefined && props.val >= props.threshold)
}

const isNg = () => {
  return props.status === 'NG' || (props.val !== null && props.val !== undefined && props.val < props.threshold)
}
</script>

<template>
  <div v-if="isEditing" class="flex flex-col items-center gap-0.5 text-2xs">
    <span class="input-label">{{ label }}</span>
    <MoleculesInputGroup addon="MΩ" class="w-[85px]">
      <Input
        v-model="modelValue"
        type="number"
        step="0.1"
        inputmode="decimal"
        placeholder="100"
        @focus="emit('focus', $event)"
        @keydown.enter.prevent="emit('enter')"
      />
    </MoleculesInputGroup>
  </div>
  <div v-else class="flex flex-col items-center gap-1">
    <span class="meas-label">{{ label }}</span>
    <div class="flex items-baseline gap-0.5">
      <span
        class="meas-val"
        :class="{
          'is-ok': isOk(),
          'is-ng': isNg(),
        }"
      >
        {{ formatMegValue(val) }}
      </span>
      <span v-if="val !== null && val !== undefined" class="meas-unit">MΩ</span>
    </div>
    <Badge
      v-if="status"
      :id="status === 'OK' ? 'exam:pass' : 'exam:fail'"
    >
      {{ status }}
    </Badge>
  </div>
</template>

<style scoped lang="scss">
.meas-label {
  font-size: var(--font-size-2xs);
  font-weight: var(--font-weight-normal);
  color: var(--color-text-secondary);
}

.meas-val {
  font-family: var(--font-mono);
  font-size: inherit;
  font-weight: var(--font-weight-normal);
  color: var(--color-text-main);

  &.is-ok {
    color: var(--color-status-success);
  }

  &.is-ng {
    color: var(--color-status-danger);
  }
}

.meas-unit {
  font-family: var(--font-base);
  font-size: var(--font-size-2xs);
  color: var(--color-text-secondary);
}

.input-label {
  font-size: var(--font-size-2xs);
  color: var(--color-text-secondary);
}
</style>
