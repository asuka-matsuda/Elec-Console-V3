<script setup lang="ts">
import { ref } from 'vue';
import { useRackCalculator } from '~/composables/calc/useRackCalculator';

useHead({
  title: 'ケーブルラック選定',
});

const {
  isStrong,
  isWeak,
  lStrong,
  lWeak,
  rackHeight,
  separatorWidth,
  strongCablesUI,
  weakCablesUI,
  result,
  addStrongCable,
  removeStrongCable,
  addWeakCable,
  removeWeakCable,
  reset,
  handleSaveHistory
} = useRackCalculator();

const isResetModalOpen = ref(false);
const confirmReset = () => {
  reset();
  isResetModalOpen.value = false;
};
</script>

<template>
  <AppToolLayout
    title="ケーブルラック選定"
    icon="align-justify"
    description="強電・弱電ケーブルのリストと段積み数から、最適なラック幅を選定します。"
    note="※ 内線規程に基づく概算です。"
  >
    <template #inputs>
      <AppToolInputPanel @reset="isResetModalOpen = true">
        <div class="l-stack" style="gap: var(--gap-section);">
          <div class="l-grid l-grid--2col">
            <AppFormGroup label="ラック深さ (H)">
              <AppInputGroup>
                <AppInput
                  v-model="rackHeight"
                  type="number"
                  min="50"
                  step="10"
                />
                <template #append>
                  <span class="c-input-addon">mm</span>
                </template>
              </AppInputGroup>
            </AppFormGroup>

            <AppFormGroup v-if="isStrong && isWeak" label="セパレータ幅">
              <AppInputGroup>
                <AppInput
                  v-model="separatorWidth"
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
            <div class="u-flex u-justify-between u-items-center u-mb-4">
              <h3 class="u-text-base u-font-bold">強電エリア</h3>
              <AppToggle v-model="isStrong" label="" />
            </div>

            <div v-if="isStrong" class="l-stack" style="gap: var(--gap-component);">
              <AppFormGroup label="段積み数">
                <AppInputGroup>
                  <AppInput
                    v-model="lStrong"
                    type="number"
                    min="1"
                  />
                  <template #append>
                    <span class="c-input-addon">段</span>
                  </template>
                </AppInputGroup>
              </AppFormGroup>

              <div>
                <div class="u-text-sm u-font-bold u-mb-2">強電ケーブルリスト</div>
                <div class="l-stack" style="gap: var(--gap-component);">
                  <AppCableRowCard
                    v-for="(cable, index) in strongCablesUI"
                    :key="cable.id"
                    v-model="strongCablesUI[index]!"
                    :index="index"
                    :removable="strongCablesUI.length > 1"
                    @remove="removeStrongCable(cable.id)"
                  />
                </div>
                <AppButton
                  variant="secondary"
                  class="u-w-full u-mt-4"
                  @click="addStrongCable"
                >
                  <AppIcon name="plus" /> 強電ケーブルを追加
                </AppButton>
              </div>
            </div>
          </AppCard>

          <!-- 弱電エリア -->
          <AppCard variant="default">
            <div class="u-flex u-justify-between u-items-center u-mb-4">
              <h3 class="u-text-base u-font-bold">弱電エリア</h3>
              <AppToggle v-model="isWeak" label="" />
            </div>

            <div v-if="isWeak" class="l-stack" style="gap: var(--gap-component);">
              <AppFormGroup label="段積み数">
                <AppInputGroup>
                  <AppInput
                    v-model="lWeak"
                    type="number"
                    min="1"
                  />
                  <template #append>
                    <span class="c-input-addon">段</span>
                  </template>
                </AppInputGroup>
              </AppFormGroup>

              <div>
                <div class="u-text-sm u-font-bold u-mb-2">弱電ケーブルリスト</div>
                <div class="l-stack" style="gap: var(--gap-component);">
                  <AppCableRowCard
                    v-for="(cable, index) in weakCablesUI"
                    :key="cable.id"
                    v-model="weakCablesUI[index]!"
                    :index="index"
                    :removable="weakCablesUI.length > 1"
                    @remove="removeWeakCable(cable.id)"
                  />
                </div>
                <AppButton
                  variant="secondary"
                  class="u-w-full u-mt-4"
                  @click="addWeakCable"
                >
                  <AppIcon name="plus" /> 弱電ケーブルを追加
                </AppButton>
              </div>
            </div>
          </AppCard>
        </div>
      </AppToolInputPanel>
    </template>

    <template #results>
      <AppToolResultPanel
        :save-disabled="result.error || (!isStrong && !isWeak)"
        @save="handleSaveHistory"
      >
        <AppResultBox
          title="推奨ラック幅"
          :status="result.error ? 'empty' : (result.isOverflow || !result.selectedSize ? 'error' : 'success')"
          :is-empty="result.error || (!isStrong && !isWeak)"
        >
          <template #value>
            <div class="p-result-rack">
              <div class="p-result-rack__val">
                <template v-if="result.error || (!isStrong && !isWeak)">
                  ---
                </template>
                <template v-else-if="result.selectedSize">
                  W{{ result.selectedSize }}
                </template>
                <template v-else>
                  規格外 ({{ Math.ceil(result.totalWidth) }}mm以上)
                </template>
              </div>
              <div v-if="result.isOverflow" class="p-result-rack__warning">
                ⚠️ ケーブルの高さがラックの有効深さ({{ result.maxDepth }}mm)を超過しています。
              </div>
            </div>
          </template>
        </AppResultBox>

        <AppResultDetails>
          <AppResultDetailsRow label="強電 必要幅">
            <strong>{{ result.wStrong.toFixed(1) }}</strong> mm
          </AppResultDetailsRow>
          <AppResultDetailsRow label="弱電 必要幅">
            <strong>{{ result.wWeak.toFixed(1) }}</strong> mm
          </AppResultDetailsRow>
          <AppResultDetailsRow v-if="isStrong && isWeak" label="セパレータ幅">
            <strong>{{ result.wSep.toFixed(1) }}</strong> mm
          </AppResultDetailsRow>
          <AppResultDetailsRow label="合計 必要幅" top-border>
            <strong>{{ Math.ceil(result.totalWidth) }}</strong> mm
          </AppResultDetailsRow>
          <AppResultDetailsRow label="最大ケーブル高さ">
            <strong :class="{'u-text-danger': result.isOverflow}">{{ result.maxCableStackHeight.toFixed(1) }}</strong> mm
            (有効 {{ result.maxDepth }} mm)
          </AppResultDetailsRow>
        </AppResultDetails>
      </AppToolResultPanel>
    </template>
  </AppToolLayout>

  <!-- リセット確認モーダル -->
  <AppToolResetModal v-model="isResetModalOpen" @confirm="confirmReset" />
</template>

<style scoped lang="scss">
.p-result-rack {
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

.u-text-danger {
  color: var(--color-status-danger) !important;
}
</style>
