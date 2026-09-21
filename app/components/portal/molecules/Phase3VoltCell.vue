<script setup lang="ts">
/**
 * Phase3VoltCell
 * [Portal Molecules] フェーズ3（送電・電圧測定）用の相別電圧値セルコンポーネント。
 * 通常表示モード（相ラベル、数値+V単位）と手入力編集モード（相ラベル+Vアドオン付Input）を提供します。
 */
const modelValue = defineModel<string | number>({ default: '' })

withDefaults(
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
</script>

<template>
  <div class="flex flex-col items-center gap-1 text-2xs">
    <span class="cell-label">{{ label }}</span>

    <!-- 手入力編集モード -->
    <Input
      v-if="isEditing"
      v-model="modelValue"
      type="number"
      step="any"
      inputmode="decimal"
      addon="V"
      class="w-20"
      @focus="emit('focus', $event)"
      @keydown.enter.prevent="emit('enter')"
    />

    <!-- 通常表示モード -->
    <div v-else class="flex items-baseline gap-0.5">
      <span
        class="cell-val"
        :class="{ 'is-active': val != null }"
      >
        {{ val ?? '-' }}
      </span>
      <span v-if="val != null" class="cell-unit">V</span>
    </div>
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

.cell-val.is-active {
  color: var(--color-category-tool);
}
</style>
