<script setup lang="ts">
import { computed, ref } from 'vue';
import { useConduitCalculator } from '~/composables/calc/useConduitCalculator';
import { conduitData } from '~/utils/data/conduitData';

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

// 配管カテゴリの選択肢
const conduitCategoryOptions = computed(() => {
  const cats = [...new Set(conduitData.map(c => c.category))];
  return cats.map(c => ({ value: c, label: c }));
});

// 保存ハンドラ
const handleSave = async () => {
  saveHistory();
};

</script>

<template>
  <AppToolLayout
    title="配管サイズ自動選定"
    icon="target"
    description="内線規程に基づき、ケーブルの断面積（占積率32% / 48%）から適切な配管サイズを導き出します。"
    note="本ツールによる計算結果は理論値です。平形ケーブル（VVF等）は長径を外径とみなして計算します。曲がりが多いルート等の場合は1サイズ余裕を見るなど、適宜ご判断ください。"
  >
    <template #inputs>
      <AppToolInputPanel @reset="openResetModal">
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
          <div class="u-text-base u-font-bold u-mb-2">収容するケーブル</div>
          
          <div class="l-stack" style="gap: var(--gap-component);">
            <AppCableRowCard
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
            class="u-w-full u-mt-4"
            @click="addCable"
          >
            <AppIcon name="plus" /> ケーブルを追加
          </AppButton>
        </div>
      </AppToolInputPanel>
    </template>

    <template #results>
      <AppToolResultPanel
        :save-disabled="!result?.success || result?.partial"
        @save="handleSave"
      >
        <AppResultBox
          title="推奨配管サイズ"
          :status="result?.success && !result?.partial ? (result?.isOversize32 && result?.isOversize48 ? 'error' : (result?.isOversize32 || result?.isOversize48 ? 'warning' : 'success')) : 'empty'"
          :is-empty="!result?.success || result?.partial"
        >
          <template #value>
            <div class="p-result-grid">
              <div class="p-result-grid__item">
                <span class="p-result-grid__label">32%以下 (異種)</span>
                <span :class="['p-result-grid__val', { 'is-error': result?.isOversize32 }]">
                  {{ result?.success && !result?.partial ? (result?.isOversize32 ? 'サイズ超過' : result?.conduit32?.size) : '---' }}
                </span>
              </div>
              <div class="p-result-grid__item">
                <span class="p-result-grid__label">48%以下 (同種)</span>
                <span :class="['p-result-grid__val', { 'is-error': result?.isOversize48 }]">
                  {{ result?.success && !result?.partial ? (result?.isOversize48 ? 'サイズ超過' : result?.conduit48?.size) : '---' }}
                </span>
              </div>
            </div>
          </template>
        </AppResultBox>

        <AppResultDetails>
          <AppResultDetailsRow label="ケーブル合計断面積">
            <strong>{{ result?.totalArea?.toFixed(1) ?? '0.0' }}</strong> mm²
          </AppResultDetailsRow>
          <AppResultDetailsRow label="許容面積 (32%)">
            <strong>{{ result?.allowable32?.toFixed(1) || '0.0' }}</strong> mm² 
            ({{ result?.fill32?.toFixed(1) || '0.0' }}%)
          </AppResultDetailsRow>
          <AppResultDetailsRow label="許容面積 (48%)">
            <strong>{{ result?.allowable48?.toFixed(1) || '0.0' }}</strong> mm² 
            ({{ result?.fill48?.toFixed(1) || '0.0' }}%)
          </AppResultDetailsRow>
        </AppResultDetails>
      </AppToolResultPanel>
    </template>

    <template #basis>
      <AppCalculationBasisPanel :steps="mathSteps">
        <div class="p-basis-note">
          <strong>内線規程（勧告）</strong><br>
          3110-5　管の屈曲が少なく、容易に電線を引き入れ及び引き替えることができる場合（48％）<br>
          3110-6　異なる太さの絶縁電線を同一管内に収める場合（32％）
        </div>
      </AppCalculationBasisPanel>
    </template>
  </AppToolLayout>

  <!-- リセット確認モーダル -->
  <AppToolResetModal v-model="isResetModalOpen" @confirm="confirmReset" />
</template>

<style scoped lang="scss">
.p-result-grid {
  display: grid;
  gap: var(--gap-element);
  
  &__item {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: var(--font-size-base);
  }
  &__label {
    color: var(--color-text-muted);
  }
  &__val {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    
    &.is-error {
      color: var(--color-status-danger);
    }
}
.p-basis-note {
  margin-top: var(--space-4);
  padding: 0 var(--space-4);
  font-size: var(--font-size-2xs);
  color: var(--color-status-warning);
}
</style>
