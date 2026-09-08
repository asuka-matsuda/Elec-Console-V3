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
  <div class="weight-input">
    <MoleculesFormGroup label="ケーブル種別" required>
      <AtomsSelect
        v-model="inputs.category"
        :options="categories"
        placeholder="選択してください"
      />
    </MoleculesFormGroup>

    <MoleculesFormGroup label="ケーブルサイズ" required>
      <AtomsSelect
        v-model="inputs.cableIdx"
        :options="availableSizes"
        placeholder="選択してください"
        :disabled="!inputs.category"
      />
    </MoleculesFormGroup>

    <MoleculesFormGroup label="ケーブル長 (L)" required>
      <MoleculesInputGroup addon="m">
        <AtomsInput v-model="inputs.L_input" type="number" min="1" />
      </MoleculesInputGroup>
    </MoleculesFormGroup>

    <MoleculesFormGroup label="ドラム占積率 (K)">
      <MoleculesInputGroup addon="倍">
        <AtomsInput
          v-model="inputs.K"
          type="number"
          step="0.01"
          min="0"
          max="1"
        />
      </MoleculesInputGroup>
    </MoleculesFormGroup>
  </div>
</template>

<style scoped lang="scss">
.weight-input {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-form-row-gap) var(--space-form-col-gap);

  @include mq("sm") {
    grid-template-columns: 1fr;
  }
}
</style>
