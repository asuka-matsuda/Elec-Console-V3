<script setup lang="ts">
/**
 * RackCalculator
 * ケーブルラック選定ツールのコンポーネントです。強電・弱電ケーブルのリストと段積み数から最適なラック幅を選定します。
 */
import { useRackCalculator } from '~/composables/tools/useRackCalculator';

useHead({
  title: 'ケーブルラック選定',
});

const {
  inputs,
  maxDepth,
  result,
  addStrongCable,
  removeStrongCable,
  addWeakCable,
  removeWeakCable,
  handleSaveHistory,
  isResetModalOpen,
  openResetModal,
  confirmReset,
  mathSteps
} = useRackCalculator();
</script>

<template>
  <ToolLayout
    title="ケーブルラック選定"
    icon="align-justify"
    description="強電・弱電ケーブルのリストと段積み数から、最適なラック幅を選定します。"
    note="※ 内線規程に基づく概算です。"
  >
    <template #inputs>
      <ToolInputPanel @reset="openResetModal">
        <div class="p-rack__sections">
          <div class="p-rack__grid">
            <AppFormGroup label="ラック深さ (H)">
              <AppInputGroup>
                <AppInput
                  v-model="inputs.rackHeight"
                  type="number"
                  min="50"
                  step="10"
                />
                <template #append>
                  <span class="c-input-addon">mm</span>
                </template>
              </AppInputGroup>
            </AppFormGroup>

            <AppFormGroup v-if="inputs.isStrong && inputs.isWeak" label="セパレータ幅">
              <AppInputGroup>
                <AppInput
                  v-model="inputs.separatorWidth"
                  type="number"
                  min="0"
                />
                <template #append>
                  <span class="c-input-addon">mm</span>
                </template>
              </AppInputGroup>
            </AppFormGroup>
          </div>

          <!-- 強電エリア -->
          <AppCard variant="default">
            <div class="p-rack__card-header">
              <h3 class="p-rack__card-title">強電エリア</h3>
              <AppToggle v-model="inputs.isStrong" label="" />
            </div>

            <div v-if="inputs.isStrong" class="p-rack__card-body">
              <AppFormGroup label="段積み数">
                <AppInputGroup>
                  <AppInput
                    v-model="inputs.lStrong"
                    type="number"
                    min="1"
                  />
                  <template #append>
                    <span class="c-input-addon">段</span>
                  </template>
                </AppInputGroup>
              </AppFormGroup>

              <div>
                <div class="p-rack__section-title">強電ケーブルリスト</div>
                <div class="p-rack__cable-list">
                  <ToolCableRowCard
                    v-for="(cable, index) in inputs.strongCablesUI"
                    :key="cable.id"
                    v-model="inputs.strongCablesUI[index]!"
                    :index="index"
                    :removable="inputs.strongCablesUI.length > 1"
                    @remove="removeStrongCable(cable.id)"
                  />
                </div>
                <AppButton variant="secondary"
                  class="p-rack__add-button"
                  @click="addStrongCable"
                >
                  <AppIcon name="plus" /> 強電ケーブルを追加
                </AppButton>
              </div>
            </div>
          </AppCard>

          <!-- 弱電エリア -->
          <AppCard variant="default">
            <div class="p-rack__card-header">
              <h3 class="p-rack__card-title">弱電エリア</h3>
              <AppToggle v-model="inputs.isWeak" label="" />
            </div>

            <div v-if="inputs.isWeak" class="p-rack__card-body">
              <AppFormGroup label="段積み数">
                <AppInputGroup>
                  <AppInput
                    v-model="inputs.lWeak"
                    type="number"
                    min="1"
                  />
                  <template #append>
                    <span class="c-input-addon">段</span>
                  </template>
                </AppInputGroup>
              </AppFormGroup>

              <div>
                <div class="p-rack__section-title">弱電ケーブルリスト</div>
                <div class="p-rack__cable-list">
                  <ToolCableRowCard
                    v-for="(cable, index) in inputs.weakCablesUI"
                    :key="cable.id"
                    v-model="inputs.weakCablesUI[index]!"
                    :index="index"
                    :removable="inputs.weakCablesUI.length > 1"
                    @remove="removeWeakCable(cable.id)"
                  />
                </div>
                <AppButton variant="secondary"
                  class="p-rack__add-button"
                  @click="addWeakCable"
                >
                  <AppIcon name="plus" /> 弱電ケーブルを追加
                </AppButton>
              </div>
            </div>
          </AppCard>
        </div>
      </ToolInputPanel>
    </template>

    <template #results>
      <ToolResultPanel
        :save-disabled="result?.error || (!inputs.isStrong && !inputs.isWeak)"
        :save-function="handleSaveHistory"
      >
        <AppResultBox
          title="推奨ラック幅"
          :status="result?.error ? 'empty' : (result?.isOverflow || !result?.selectedSize ? 'error' : 'success')"
          :is-empty="result?.error || (!inputs.isStrong && !inputs.isWeak)"
        >
          <template #value>
            <div class="p-result-rack">
              <div class="p-result-rack__val">
                <template v-if="result?.error || (!inputs.isStrong && !inputs.isWeak)">
                  ---
                </template>
                <template v-else-if="result?.selectedSize">
                  W{{ result?.selectedSize }}
                </template>
                <template v-else>
                  規格外 ({{ result?.totalWidth ? Math.ceil(result.totalWidth) : 0 }}mm以上)
                </template>
              </div>
              <div v-if="result?.isOverflow" class="p-result-rack__warning">
                ⚠️ ケーブルの高さがラックの有効深さ({{ maxDepth }}mm)を超過しています。
              </div>
            </div>
          </template>
        </AppResultBox>

        <ToolResultDetails>
          <ToolResultDetailsRow label="強電 必要幅">
            <strong>{{ result?.wStrong?.toFixed(1) ?? '0.0' }}</strong> mm
          </ToolResultDetailsRow>
          <ToolResultDetailsRow label="弱電 必要幅">
            <strong>{{ result?.wWeak?.toFixed(1) ?? '0.0' }}</strong> mm
          </ToolResultDetailsRow>
          <ToolResultDetailsRow v-if="inputs.isStrong && inputs.isWeak" label="セパレータ幅">
            <strong>{{ result?.wSep?.toFixed(1) ?? '0.0' }}</strong> mm
          </ToolResultDetailsRow>
          <ToolResultDetailsRow label="合計 必要幅" top-border>
            <strong>{{ result?.totalWidth ? Math.ceil(result.totalWidth) : 0 }}</strong> mm
          </ToolResultDetailsRow>
          <ToolResultDetailsRow label="最大ケーブル高さ">
            <strong :class="{'is-overflow': result?.isOverflow}">{{ result?.maxCableStackHeight?.toFixed(1) ?? '0.0' }}</strong> mm
            (有効 {{ maxDepth }} mm)
          </ToolResultDetailsRow>
        </ToolResultDetails>
      </ToolResultPanel>
    </template>

    <template #basis>
      <ToolCalculationBasisPanel :steps="mathSteps" />
    </template>
    </ToolLayout>

    <!-- リセット確認モーダル -->
    <AppConfirmModal v-model="isResetModalOpen" title="リセットの確認" message="入力した条件をすべてリセットしますか？" confirm-text="リセットする" @confirm="confirmReset" />
</template>

<style scoped lang="scss">
.p-result-rack {
  // --- レイアウト・配置 ---
  @include flex-column(var(--gap-element));

  // --- 子要素 ---
  &__val {
    // --- 継承 ---
    @extend %text-title-xl;
  }

  &__warning {
    // --- 継承 ---
    @extend %text-title-sm;

    // --- ボックスモデル ---
    padding: var(--gap-element);

    // --- タイポグラフィ ---
    color: var(--color-status-danger);
  }
}

.is-overflow {
  // --- タイポグラフィ ---
  color: var(--color-status-danger);
}

.p-rack {
  // --- 子要素 ---
  &__sections {
    // --- レイアウト・配置 ---
    @include flex-column(var(--gap-section));
  }

  &__grid {
    // --- レイアウト・配置 ---
    @include grid;

    @include cq("xs") {
      // --- レイアウト・配置 ---
      grid-template-columns: repeat(2, 1fr);
    }
  }

  &__card-header {
    // --- レイアウト・配置 ---
    @include flex-between;

    // --- ボックスモデル ---
    margin-bottom: var(--pad-container);
  }

  &__card-title {
    // --- 継承 ---
    @extend %text-title-md;
  }

  &__card-body {
    // --- レイアウト・配置 ---
    @include flex-column;
  }

  &__section-title {
    // --- 継承 ---
    @extend %text-desc;

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
