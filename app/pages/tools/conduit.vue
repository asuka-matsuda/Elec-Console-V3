<script setup lang="ts">
/**
 * ConduitCalculator
 * 配管サイズ自動選定ツールのコンポーネントです。収容するケーブルの種類と数から、適切な配管サイズを計算します。
 */
import { computed } from 'vue';
import { useConduitCalculator } from '~/composables/tools/useConduitCalculator';
import { conduitData } from '~/constants/data/conduitData';

useHead({
  title: '配管サイズ自動選定',
});

const {
  inputs,
  result,
  addCable,
  removeCable,
  saveHistory,
  isResetModalOpen,
  openResetModal,
  confirmReset,
  mathSteps
} = useConduitCalculator();

/** 配管カテゴリの選択肢 */
const conduitCategoryOptions = computed(() => {
  const cats = [...new Set(conduitData.map(c => c.category))];
  return cats.map(c => ({ value: c, label: c }));
});

/** 保存ハンドラ */
const handleSave = async () => {
  await saveHistory();
};

</script>

<template>
  <ToolLayout
    title="配管サイズ自動選定"
    icon="target"
    description="内線規程に基づき、ケーブルの断面積（占積率32% / 48%）から適切な配管サイズを導き出します。"
    note="本ツールによる計算結果は理論値です。平形ケーブル（VVF等）は長径を外径とみなして計算します。曲がりが多いルート等の場合は1サイズ余裕を見るなど、適宜ご判断ください。"
  >
    <template #inputs>
      <ToolInputPanel @reset="openResetModal">
        <!-- 1. 対象の配管種類 -->
        <AppFormGroup label="対象の配管種類">
          <AppSelect
            v-model="inputs.conduitCategory"
            :options="conduitCategoryOptions"
            placeholder="選択してください"
          />
        </AppFormGroup>

        <!-- 2. 収容するケーブル -->
        <div>
          <div class="p-conduit__section-title">
            収容するケーブル
          </div>

          <div class="p-conduit__cable-list">
            <ToolCableCard
              v-for="(cable, index) in inputs.inputCables"
              :key="cable.id"
              v-model="inputs.inputCables[index]!"
              :index="index"
              :removable="inputs.inputCables.length > 1"
              @remove="removeCable(cable.id)"
            />
          </div>

          <AppButton
            variant="success"
            class="p-conduit__add-button"
            @click="addCable"
          >
            <AppIcon name="plus" /> ケーブルを追加
          </AppButton>
        </div>
      </ToolInputPanel>
    </template>

    <template #results>
      <ToolResultPanel
        :save-disabled="!result?.success || result?.partial"
        :save-function="handleSave"
      >
        <ToolConduitResult :result="result" />
      </ToolResultPanel>
    </template>

    <template #basis>
      <ToolCalcBasisPanel :steps="mathSteps">
        <div class="p-basis-note">
          <strong>内線規程（勧告）</strong><br>
          3110-5 管の屈曲が少なく、容易に電線を引き入れ及び引き替えることができる場合（48％）<br>
          3110-6 異なる太さの絶縁電線を同一管内に収める場合（32％）
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
.p-basis-note {
  // --- 継承 ---
  @include text-meta;

  // --- タイポグラフィ ---
  color: var(--color-status-warning);
}

.p-conduit {
  // --- 子要素 ---
  &__section-title {
    // --- 継承 ---
    @include text-title-sm;

    // --- ボックスモデル ---
    margin-bottom: var(--gap-component);

  }

  &__cable-list {
    // --- レイアウト・配置 ---
    @include flex-column;
  }

  &__add-button {
    // --- ボックスモデル ---
    width: 100%;
    margin-top: var(--pad-container);
  }
}
</style>

