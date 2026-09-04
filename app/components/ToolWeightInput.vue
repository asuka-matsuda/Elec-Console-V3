<script setup lang="ts">
/**
 * ToolWeightInput
 * ケーブル重量・ドラム選定ツールの条件入力フォームコンポーネントです。
 * 2等分グリッドで条件入力を提供します。
 */
import { computed, watch } from 'vue'

import { getAvailableSizes, getCableCategories } from '~/utils/cable'
import type { WeightCalcInputs } from '~/utils/tools/weight/weightCalcLogic'

const inputs = defineModel<WeightCalcInputs>({ required: true })

const categories = computed(() => getCableCategories())
const availableSizes = computed(() => getAvailableSizes(inputs.value.category))

watch(
  () => inputs.value.category,
  (newVal, oldVal) => {
    if (!oldVal) return
    inputs.value.cableIdx = ''
  },
)
</script>

<template>
  <div class="c-weight-input">
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
</template>

<style scoped lang="scss">
.c-weight-input {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-form-row-gap) var(--space-form-col-gap);

  @include mq("sm") {
    grid-template-columns: 1fr;
  }
}
</style>
