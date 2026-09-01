<script setup lang="ts">
/**
 * ToolCableRowCard
 * ケーブルの種類、サイズ、本数を入力するためのカードコンポーネントです。
 */
import { computed } from 'vue'

import { cableData } from '~/constants/data/cableData'
import { getAvailableSizes, getCableCategories } from '~/utils/cable'
import { calculateCableArea } from '~/utils/tools/conduit/conduitCalcLogic'

/**
 * CableInput is used as a generic type here, but make sure
 * it matches { id: string, category: string, cableIdx: string, count: number | null }
 */
const props = defineProps<{
  modelValue: { id: string, category: string, cableIdx: string, count: number | null }
  index: number
  removable?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: { id: string, category: string, cableIdx: string, count: number | null }): void
  (e: 'remove'): void
}>()

const categories = computed(() => getCableCategories())
const availableSizes = computed(() =>
  getAvailableSizes(props.modelValue.category),
)

const singleCableArea = computed(() => {
  const cableIdxStr = (props.modelValue.cableIdx || '')

  if (!cableIdxStr || !cableIdxStr.startsWith('idx_')) return null
  const idx = parseInt(cableIdxStr.replace('idx_', ''), 10)
  const def = cableData[idx]

  if (!def) return null

  return calculateCableArea(def.diameter)
})

const onCategoryChange = (val: string | number | boolean | null | undefined) => {
  emit('update:modelValue', {
    ...props.modelValue,
    category: String(val),
    cableIdx: '',
  })
}

const updateCableIdx = (val: string | number | boolean | null | undefined) => {
  emit('update:modelValue', {
    ...props.modelValue,
    cableIdx: String(val),
  })
}

const updateCount = (val: string | number | boolean | null | undefined) => {
  emit('update:modelValue', {
    ...props.modelValue,
    count: Number(val),
  })
}
</script>

<template>
  <AppCard
    class="c-cable-row"
    variant="default"
  >
    <div class="c-cable-row__header">
      <div class="c-cable-row__title-group">
        <span class="c-cable-row__title">ケーブル {{ index + 1 }}</span>
        <span
          v-if="singleCableArea !== null"
          class="c-cable-row__meta"
        >
          ( 断面積: {{ singleCableArea.toFixed(1) }} mm² / 本 )
        </span>
      </div>
      <AppButton
        v-if="removable"
        variant="danger"
        size="sm"
        icon-only
        @click="emit('remove')"
      >
        <AppIcon
          name="trash-2"
          size="sm"
        />
      </AppButton>
    </div>
    <div>
      <div class="l-grid l-grid--3col">
        <AppFormGroup label="ケーブル種別">
          <AppSelect
            :model-value="modelValue.category"
            :options="categories"
            placeholder="選択"
            @update:model-value="onCategoryChange"
          />
        </AppFormGroup>

        <AppFormGroup label="ケーブルサイズ">
          <AppSelect
            :model-value="modelValue.cableIdx"
            :options="availableSizes"
            placeholder="選択"
            :disabled="!modelValue.category"
            @update:model-value="updateCableIdx"
          />
        </AppFormGroup>

        <AppFormGroup label="本数">
          <AppInputGroup>
            <AppInput
              :model-value="modelValue.count"
              type="number"
              min="1"
              @update:model-value="updateCount"
            />
            <template #append>
              <span class="c-input-addon">本</span>
            </template>
          </AppInputGroup>
        </AppFormGroup>
      </div>
    </div>
  </AppCard>
</template>

<style scoped lang="scss">
.c-cable-row {
  @include flex-start-stretch($direction: column);

  gap: var(--space-1);

  &__header {
    @include flex-between-center;
  }

  &__title-group {
    @include flex-start-center;
  }

  &__title {
    @include text-title("sm");

    color: var(--color-text-main);
  }

  &__meta {
    @include text-meta;
  }
}
</style>
