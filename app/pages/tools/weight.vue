<script setup lang="ts">
/**
 * WeightCalculator
 * ケーブル重量・ドラム選定ツールのコンポーネントです。ケーブルの種類と長さから重量を計算し、最適なドラムを選定します。
 */
import { computed } from "vue";

import { useWeightCalculator } from "~/composables/tools/useWeightCalculator";
import { getAvailableSizes, getCableCategories } from "~/utils/cable";

useHead({
  title: "ケーブル重量・ドラム選定",
});

const {
  inputs,
  result,
  handleSaveHistory,
  isResetModalOpen,
  openResetModal,
  confirmReset,
  mathSteps,
} = useWeightCalculator();

/** ケーブル選択用データ */
const categories = computed(() => getCableCategories());
const availableSizes = computed(() => getAvailableSizes(inputs.value.category));

/** Categoryが変更されたらcableIdxをリセットする */
watch(
  () => inputs.value.category,
  (newVal, oldVal) => {
    if (!oldVal) return;
    inputs.value.cableIdx = "";
  },
);

/** 総重量の計算 */
const totalWeight = computed(() => {
  if (!result.value || result.value?.error || !result.value?.bestDrum) return 0;

  return (
    (result.value?.cableWeight || 0) +
    parseFloat((result.value?.bestDrum?.weight as unknown as string) || "0")
  );
});
</script>

<template>
  <ToolLayout
    title="ケーブル重量・ドラム選定"
    icon="package"
    description="ケーブルの種類と長さから重量を計算し、最適なドラムを選定します。"
    note="※ ドラムは木枠ドラム（L, M, S 等）から選定されます。"
  >
    <template #inputs>
      <ToolInputPanel @reset="openResetModal">
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
                <AppInput v-model="inputs.L_input" type="number" min="1" />
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
      </ToolInputPanel>
    </template>

    <template #results>
      <ToolResultPanel
        :save-disabled="result?.error"
        :save-function="handleSaveHistory"
      >
        <AppResultBox
          title="推奨ドラム"
          :status="
            result?.error ? 'empty' : result?.bestDrum ? 'success' : 'error'
          "
          :is-empty="result?.error"
        >
          <template #value>
            <div class="p-result-weight">
              <div class="p-result-weight__val">
                <template v-if="result?.error"> --- </template>
                <template v-else-if="result?.bestDrum">
                  {{ result?.bestDrum?.category }} ({{ result?.bestDrum?.id }})
                </template>
                <template v-else> 選定不可 </template>
              </div>
              <div
                v-if="!result?.error && !result?.bestDrum"
                class="p-result-weight__warning"
              >
                ⚠️ 条件に合うドラムが見つかりませんでした。
              </div>
            </div>
          </template>
        </AppResultBox>

        <ToolResultDetails v-if="!result?.error">
          <ToolResultRow label="ケーブル総重量">
            <strong>{{ result?.cableWeight?.toFixed(1) }}</strong> kg
          </ToolResultRow>
          <template v-if="result?.bestDrum">
            <ToolResultRow label="ドラム空重量">
              <strong>{{ result?.bestDrum?.weight }}</strong> kg
            </ToolResultRow>
            <ToolResultRow label="総重量 (ケーブル+ドラム)" top-border>
              <strong>{{ totalWeight?.toFixed(1) }}</strong> kg
            </ToolResultRow>
            <ToolResultRow label="最大巻取可能長" class="u-mt-2">
              <strong>{{ result?.maxCapacityMeters?.toFixed(1) }}</strong> m
            </ToolResultRow>
          </template>
        </ToolResultDetails>
      </ToolResultPanel>
    </template>

    <template #basis>
      <ToolCalcBasisPanel :steps="mathSteps">
        <div class="p-weight__note">
          <strong>【ドラム選定ロジック】</strong><br />
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
      </ToolCalcBasisPanel>
    </template>
  </ToolLayout>

  <!-- リセット確認モーダル -->
  <AppConfirmModal
    v-model="isResetModalOpen"
    title="リセットの確認"
    message="入力した条件をすべてリセットしますか？"
    confirm-text="リセットする"
    @confirm="confirmReset"
  />
</template>

<style scoped lang="scss">
.p-result-weight {
  @include flex-start-stretch($direction: column);

  gap: var(--space-1);

  &__val {
    @include text-title("xl");
  }

  &__warning {
    @include text-desc;

    padding: var(--space-1) var(--space-2);
    color: var(--color-status-danger);
  }
}

.p-weight {
  &__sections {
    @include flex-start-stretch($direction: column);

    gap: var(--space-card-gap);
  }

  &__note {
    @include text-meta;

    padding: 0 var(--space-3);
    color: var(--color-text-muted);
  }

  &__note-list {
    padding-left: var(--space-layout-pad);
    list-style-type: disc;
  }
}
</style>
