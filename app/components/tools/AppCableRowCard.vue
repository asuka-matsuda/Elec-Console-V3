<script setup lang="ts">
import { computed } from 'vue';
import { cableData } from '~/utils/data/cableData';
import type { CableInput } from '~/utils/calc/conduit/conduitCalcLogic';
import { useCableSelector } from '~/composables/calc/useCableSelector';

const props = defineProps<{
  modelValue: CableInput;
  index: number;
  removable?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: CableInput): void;
  (e: 'remove'): void;
}>();

const selectedCategory = computed(() => props.modelValue.category);
const selectedSize = computed(() => props.modelValue.size);

const { categories, combinedSpecOptions } = useCableSelector(
  cableData,
  selectedCategory,
  selectedSize
);

// specが変更された時のハンドリング
const selectedSpec = computed({
  get: () => {
    if (!props.modelValue.size || !props.modelValue.cores) return '';
    return `${props.modelValue.size}|${props.modelValue.cores}`;
  },
  set: (val: string) => {
    const [size, cores] = val.split('|');
    emit('update:modelValue', {
      ...props.modelValue,
      size: size || '',
      cores: cores || ''
    });
  }
});

// カテゴリ変更時にspecをリセット
const onCategoryChange = (val: any) => {
  emit('update:modelValue', {
    ...props.modelValue,
    category: String(val),
    size: '',
    cores: ''
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
        <AppFormGroup label="種類">
          <AppSelect
            :model-value="modelValue.category"
            :options="categories"
            placeholder="選択"
            @update:model-value="onCategoryChange"
          />
        </AppFormGroup>
        
        <AppFormGroup label="サイズ・芯線数">
          <AppSelect
            v-model="selectedSpec"
            :options="combinedSpecOptions"
            placeholder="選択"
            :disabled="!modelValue.category"
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
