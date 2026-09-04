<script setup lang="ts">
/**
 * ToolCableItemCard
 * ケーブルの種類、サイズ、本数を入力するためのカードコンポーネントです。
 * 配管サイズ選定およびケーブルラック選定で共通して使用されます。
 */
import { computed } from 'vue'

import { cableData } from '~/constants/data/cableData'
import type { CableInputItem } from '~/types/tools'
import { getAvailableSizes, getCableCategories } from '~/utils/cable'
import { calculateCableArea } from '~/utils/tools/conduit/conduitCalcLogic'

const model = defineModel<CableInputItem>({ required: true })

defineProps<{
  index: number
  removable?: boolean
}>()

const emit = defineEmits<{
  (e: 'remove'): void
}>()

const categories = computed(() => getCableCategories())
const availableSizes = computed(() => getAvailableSizes(model.value.category))

const singleCableArea = computed(() => {
  const cableIdxStr = model.value.cableIdx || ''

  if (!cableIdxStr || !cableIdxStr.startsWith('idx_')) return null
  const idx = parseInt(cableIdxStr.replace('idx_', ''), 10)
  const def = cableData[idx]

  if (!def) return null

  return calculateCableArea(def.diameter)
})

const onCategoryChange = (val: unknown) => {
  model.value = {
    ...model.value,
    category: String(val ?? ''),
    cableIdx: '',
  }
}
</script>

<template>
  <AppCard class="c-cable-item">
    <template #header>
      <div class="c-cable-item__header">
        <div class="c-cable-item__title-group">
          <span>ケーブル {{ index + 1 }}</span>
          <span v-if="singleCableArea !== null" class="c-cable-item__meta">
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
          <AppIcon name="trash-2" size="sm" />
        </AppButton>
      </div>
    </template>

    <div class="c-cable-item__grid">
      <AppFormGroup label="ケーブル種別">
        <AppSelect
          :model-value="model.category"
          :options="categories"
          placeholder="選択"
          @update:model-value="onCategoryChange"
        />
      </AppFormGroup>

      <AppFormGroup label="ケーブルサイズ">
        <AppSelect
          v-model="model.cableIdx"
          :options="availableSizes"
          placeholder="選択"
          :disabled="!model.category"
        />
      </AppFormGroup>

      <AppFormGroup label="本数">
        <AppInputGroup>
          <AppInput
            v-model.number="model.count"
            type="number"
            min="1"
          />
          <template #append>
            <span class="c-input-addon">本</span>
          </template>
        </AppInputGroup>
      </AppFormGroup>
    </div>
  </AppCard>
</template>

<style scoped lang="scss">
.c-cable-item {
  &__header {
    @include flex-between-center;
  }

  &__title-group {
    @include flex-start-center;

    gap: var(--space-2);
  }

  &__meta {
    @include text-meta;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-form-row-gap) var(--space-form-col-gap);

    @include mq("sm") {
      grid-template-columns: 1fr;
    }
  }
}
</style>
