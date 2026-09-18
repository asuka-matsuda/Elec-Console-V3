<script setup lang="ts">
/**
 * PortalMoleculesPhase3VoltCell
 * [Portal Molecules] フェーズ3（送電・電圧測定）用の相別電圧値セルコンポーネント。
 * 通常表示モード（相ラベル、数値+V単位）と手入力編集モード（相ラベル+Vアドオン付Input）を提供します。
 */
const modelValue = defineModel<string | number>({ default: '' })

const props = withDefaults(
  defineProps<{
    label: string
    val?: number | null
    isEditing?: boolean
  }>(),
  {
    val: null,
    isEditing: false,
  },
)

const emit = defineEmits<{
  (e: 'enter'): void
  (e: 'focus', event: FocusEvent): void
}>()

const formatVoltage = (v: number | null | undefined) => {
  if (v === null || v === undefined) return '-'

  return `${v}`
}

const isActive = () => props.val !== null && props.val !== undefined
</script>

<template>
  <div v-if="isEditing" class="flex flex-col items-center gap-0.5 text-2xs">
    <span class="input-label">{{ label }}</span>
    <Input
      v-model="modelValue"
      type="number"
      step="any"
      inputmode="decimal"
      addon="V"
      class="w-20"
      @focus="emit('focus', $event)"
      @keydown.enter.prevent="emit('enter')"
    />
  </div>
  <div v-else class="flex flex-col items-center gap-1">
    <span class="volt-label">{{ label }}</span>
    <div class="flex items-baseline gap-0.5">
      <span
        class="volt-val"
        :class="{ 'is-active': isActive() }"
      >
        {{ formatVoltage(val) }}
      </span>
      <span v-if="isActive()" class="volt-unit">V</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.volt-label {
  font-size: var(--font-size-2xs);
  font-weight: var(--font-weight-normal);
  color: var(--color-text-secondary);
}

.volt-val {
  font-family: var(--font-mono);
  font-size: inherit;
  font-weight: var(--font-weight-normal);
  color: var(--color-text-main);

  &.is-active {
    color: var(--color-category-tool);
  }
}

.volt-unit {
  font-family: var(--font-base);
  font-size: var(--font-size-2xs);
  color: var(--color-text-secondary);
}

.input-label {
  font-size: var(--font-size-2xs);
  color: var(--color-text-secondary);
}
</style>
