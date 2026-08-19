<script setup lang="ts">
import { computed } from 'vue';
import type { CableInput } from '~/utils/calc/conduit/conduitCalcLogic';
import { getCableCategories, getAvailableSizes } from '~/utils/cableDataHelper';

// note: CableInput is used as a generic type here, but make sure 
// it matches { id: string, category: string, cableIdx: string, count: number | null }
const props = defineProps<{
  modelValue: any; 
  index: number;
  removable?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
  (e: 'remove'): void;
}>();

const categories = computed(() => getCableCategories());
const availableSizes = computed(() => getAvailableSizes(props.modelValue.category));

// カテゴリ変更時にcableIdxをリセット
const onCategoryChange = (val: any) => {
  emit('update:modelValue', {
    ...props.modelValue,
    category: String(val),
    cableIdx: ''
  });
};

const updateCableIdx = (val: any) => {
  emit('update:modelValue', {
    ...props.modelValue,
    cableIdx: String(val)
  });
};

const updateCount = (val: any) => {
  emit('update:modelValue', {
    ...props.modelValue,
    count: Number(val)
  });
};
</script>

<template>
  <AppCard class="c-cable-row" variant="default">
    <div class="c-cable-row__header">
      <span class="c-cable-row__title">ケーブル {{ index + 1 }}</span>
      <AppButtonDanger v-if="removable" size="sm" icon-only @click="emit('remove')">
        <AppIcon name="trash-2" size="sm" />
      </AppButtonDanger>
    </div>
    <div class="c-cable-row__body">
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
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--gap-element);
  }

  &__title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }
}
</style>
