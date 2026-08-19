<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWeightCalculator } from '~/composables/calc/useWeightCalculator';
import { cableData } from '~/utils/data/cableData';
import { drumData } from '~/utils/data/drumData';

useHead({
  title: 'ケーブル重量・ドラム選定',
});

const {
  category,
  size,
  cores,
  L_input,
  K,
  result,
  reset,
  handleSaveHistory
} = useWeightCalculator();

const isResetModalOpen = ref(false);
const confirmReset = () => {
  reset();
  isResetModalOpen.value = false;
};

// ケーブル選択用データ
const categories = computed(() => {
  return Array.from(new Set(cableData.map(c => c.category))).sort();
});

const availableSizes = computed(() => {
  if (!category.value) return [];
  const sizes = cableData
    .filter(c => c.category === category.value)
    .map(c => c.size);
  return Array.from(new Set(sizes)).sort((a, b) => {
    const numA = parseFloat(a) || 0;
    const numB = parseFloat(b) || 0;
    if (numA !== numB) return numA - numB;
    return a.localeCompare(b);
  });
});

const availableCores = computed(() => {
  if (!category.value || !size.value) return [];
  const coreList = cableData
    .filter(c => c.category === category.value && c.size === size.value)
    .map(c => c.cores);
  return Array.from(new Set(coreList)).sort((a, b) => {
    const numA = parseInt(a) || 0;
    const numB = parseInt(b) || 0;
    if (numA !== numB) return numA - numB;
    return a.localeCompare(b);
  });
});

// Category/Sizeが変更されたらCoresをリセットする
watch(category, () => {
  size.value = '';
  cores.value = '';
});
watch(size, () => {
  cores.value = '';
});

// 総重量の計算
const totalWeight = computed(() => {
  if (result.value.error || !result.value.bestDrum) return 0;
  return (result.value.cableWeight || 0) + parseFloat(result.value.bestDrum.weight);
});
</script>

<template>
  <AppToolLayout
    title="ケーブル重量・ドラム選定"
    icon="package"
    description="ケーブルの種類と長さから重量を計算し、最適なドラムを選定します。"
    note="※ ドラムは木枠ドラム（L, M, S 等）から選定されます。"
  >
    <template #inputs>
      <AppToolInputPanel @reset="isResetModalOpen = true">
        <div class="l-stack" style="gap: var(--gap-section);">
          <div class="l-grid l-grid--2col">
            <AppFormGroup label="ケーブル種類" required>
              <select v-model="category" class="c-input">
                <option value="">選択してください</option>
                <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
              </select>
            </AppFormGroup>
            
            <AppFormGroup label="サイズ" required>
              <select v-model="size" class="c-input" :disabled="!category">
                <option value="">選択してください</option>
                <option v-for="s in availableSizes" :key="s" :value="s">{{ s }}</option>
              </select>
            </AppFormGroup>
            
            <AppFormGroup label="芯数" required>
              <select v-model="cores" class="c-input" :disabled="!size">
                <option value="">選択してください</option>
                <option v-for="c in availableCores" :key="c" :value="c">{{ c }}</option>
              </select>
            </AppFormGroup>
          </div>

          <div class="l-grid l-grid--2col">
            <AppFormGroup label="ケーブル長 (L)" required>
              <AppInputGroup>
                <AppInput
                  v-model="L_input"
                  type="number"
                  min="1"
                />
                <template #append>
                  <span class="c-input-addon">m</span>
                </template>
              </AppInputGroup>
            </AppFormGroup>

            <AppFormGroup label="ドラム占積率 (K)">
              <AppInputGroup>
                <AppInput
                  v-model="K"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                />
                <template #append>
                  <span class="c-input-addon">倍</span>
                </template>
              </AppInputGroup>
            </AppFormGroup>
          </div>
        </div>
      </AppToolInputPanel>
    </template>

    <template #results>
      <AppToolResultPanel
        :save-disabled="result.error"
        @save="handleSaveHistory"
      >
        <AppResultBox
          title="推奨ドラム"
          :status="result.error ? 'empty' : (result.bestDrum ? 'success' : 'error')"
          :is-empty="result.error"
        >
          <template #value>
            <div class="p-result-weight">
              <div class="p-result-weight__val">
                <template v-if="result.error">
                  ---
                </template>
                <template v-else-if="result.bestDrum">
                  {{ result.bestDrum.category }} ({{ result.bestDrum.id }})
                </template>
                <template v-else>
                  選定不可
                </template>
              </div>
              <div v-if="!result.error && !result.bestDrum" class="p-result-weight__warning">
                ⚠️ 条件に合うドラムが見つかりませんでした。
              </div>
            </div>
          </template>
        </AppResultBox>

        <AppResultDetails v-if="!result.error">
          <AppResultDetailsRow label="ケーブル総重量">
            <strong>{{ result.cableWeight?.toFixed(1) }}</strong> kg
          </AppResultDetailsRow>
          <template v-if="result.bestDrum">
            <AppResultDetailsRow label="ドラム空重量">
              <strong>{{ result.bestDrum.weight }}</strong> kg
            </AppResultDetailsRow>
            <AppResultDetailsRow label="総重量 (ケーブル+ドラム)" top-border>
              <strong>{{ totalWeight.toFixed(1) }}</strong> kg
            </AppResultDetailsRow>
            <AppResultDetailsRow label="最大巻取可能長" class="u-mt-2">
              <strong>{{ result.maxCapacityMeters?.toFixed(1) }}</strong> m
            </AppResultDetailsRow>
          </template>
        </AppResultDetails>
      </AppToolResultPanel>
    </template>
  </AppToolLayout>

  <!-- リセット確認モーダル -->
  <AppToolResetModal v-model="isResetModalOpen" @confirm="confirmReset" />
</template>

<style scoped lang="scss">
.p-result-weight {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  
  &__val {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }
  
  &__warning {
    font-size: var(--font-size-sm);
    color: var(--color-status-danger);
    background-color: color-mix(in srgb, var(--color-status-danger) 10%, transparent);
    padding: var(--space-2);
    border-radius: var(--radius-sm);
  }
}
</style>
