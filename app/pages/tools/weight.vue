<script setup lang="ts">
/**
 * WeightCalculator
 * ケーブル重量・ドラム選定ツールのコンポーネントです。ケーブルの種類と長さから重量を計算し、最適なドラムを選定します。
 */
import { computed } from 'vue';
import { useWeightCalculator } from '~/composables/calc/useWeightCalculator';

import { getCableCategories, getAvailableSizes } from '~/utils/cableDataHelper';

useHead({
  title: 'ケーブル重量・ドラム選定',
});

const {
  inputs,
  result,
  handleSaveHistory,
  isResetModalOpen,
  openResetModal,
  confirmReset,
  mathSteps
} = useWeightCalculator();

/** ケーブル選択用データ */
const categories = computed(() => getCableCategories());
const availableSizes = computed(() => getAvailableSizes(inputs.value.category));

/** Categoryが変更されたらcableIdxをリセットする */
watch(() => inputs.value.category, () => {
  inputs.value.cableIdx = '';
});



/** 総重量の計算 */
const totalWeight = computed(() => {
  if (!result.value || result.value?.error || !result.value?.bestDrum) return 0;
  return (result.value?.cableWeight || 0) + parseFloat(result.value?.bestDrum?.weight as any || '0');
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
      <AppToolInputPanel @reset="openResetModal">
        <div class="p-weight__sections">
          <div class="l-grid l-grid--2col">
            <AppFormGroup label="ケーブル種別" required>
              <AppSelect
                v-model="inputs.category"
                :options="categories"
                placeholder="選択してください"
              />
            </AppFormGroup>
            
            <AppFormGroup label="ケーブルサイズ" required>
              <AppSelect
                v-model="inputs.cableIdx"
                :options="availableSizes"
                placeholder="選択してください"
                :disabled="!inputs.category"
              />
            </AppFormGroup>
          </div>

          <div class="l-grid l-grid--2col">
            <AppFormGroup label="ケーブル長 (L)" required>
              <AppInputGroup>
                <AppInput
                  v-model="inputs.L_input"
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
                  v-model="inputs.K"
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
        :save-disabled="result?.error"
        @save="handleSaveHistory"
      >
        <AppResultBox
          title="推奨ドラム"
          :status="result?.error ? 'empty' : (result?.bestDrum ? 'success' : 'error')"
          :is-empty="result?.error"
        >
          <template #value>
            <div class="p-result-weight">
              <div class="p-result-weight__val">
                <template v-if="result?.error">
                  ---
                </template>
                <template v-else-if="result?.bestDrum">
                  {{ result?.bestDrum?.category }} ({{ result?.bestDrum?.id }})
                </template>
                <template v-else>
                  選定不可
                </template>
              </div>
              <div v-if="!result?.error && !result?.bestDrum" class="p-result-weight__warning">
                ⚠️ 条件に合うドラムが見つかりませんでした。
              </div>
            </div>
          </template>
        </AppResultBox>

        <AppResultDetails v-if="!result?.error">
          <AppResultDetailsRow label="ケーブル総重量">
            <strong>{{ result?.cableWeight?.toFixed(1) }}</strong> kg
          </AppResultDetailsRow>
          <template v-if="result?.bestDrum">
            <AppResultDetailsRow label="ドラム空重量">
              <strong>{{ result?.bestDrum?.weight }}</strong> kg
            </AppResultDetailsRow>
            <AppResultDetailsRow label="総重量 (ケーブル+ドラム)" top-border>
              <strong>{{ totalWeight?.toFixed(1) }}</strong> kg
            </AppResultDetailsRow>
            <AppResultDetailsRow label="最大巻取可能長" class="u-mt-2">
              <strong>{{ result?.maxCapacityMeters?.toFixed(1) }}</strong> m
            </AppResultDetailsRow>
          </template>
        </AppResultDetails>
      </AppToolResultPanel>
    </template>

    <template #basis>
      <AppCalculationBasisPanel :steps="mathSteps">
        <div class="p-weight__note">
          <strong>【ドラム選定ロジック】</strong><br>
          上記①〜③の計算をデータベース上のすべてのドラムに対して行い、重量要件、曲げ半径要件、容量要件のすべてをクリアするドラムのうち、「自重が最も軽いもの」を最適なドラムとして最終選定しています。
        </div>

        <div class="p-weight__note">
          <p><strong>【変数の定義】</strong></p>
          <ul class="p-weight__note-list">
            <li>D1: つば径</li>
            <li>D2: 胴径</li>
            <li>W2: 内幅</li>
            <li>d: ケーブル外径</li>
            <li>g: 巻きあき寸法</li>
            <li>K: 補正係数</li>
          </ul>
        </div>
      </AppCalculationBasisPanel>
    </template>
    </AppToolLayout>

    <!-- リセット確認モーダル -->
    <AppToolResetModal v-model="isResetModalOpen" @confirm="confirmReset" />
</template>

<style scoped lang="scss">
.p-result-weight {
  display: flex;
  flex-direction: column;
  gap: var(--gap-element);
  
  &__val {
    @extend %text-2xl;

    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }
  
  &__warning {
    @extend %text-sm;

    padding: var(--gap-element);
    color: var(--color-status-danger);
  }
}

.p-weight {
  // --- Base Styles ---

  &__sections {
    display: flex;
    flex-direction: column;
    gap: var(--gap-section);
  }

  &__note {

    @extend %text-xs;

    margin-top: var(--space-4);
    padding: 0 var(--space-4);
    color: var(--color-text-muted);
  }
  
  &__note-list {
    padding-left: var(--space-4);
    list-style-type: disc;
  }
}
</style>
