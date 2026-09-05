<script setup lang="ts">
/**
 * ConduitCalculator
 * 配管サイズ自動選定ツールのコンポーネントです。収容するケーブルの種類と数から、適切な配管サイズを計算します。
 */
import { computed } from 'vue'

import { useConduitCalculator } from '~/composables/tools/useConduitCalculator'
import { conduitData } from '~/constants/data/conduitData'

useHead({
  title: '配管サイズ自動選定',
})

const {
  inputs,
  result,
  addCable,
  removeCable,
  handleSaveHistory,
  openResetModal,
  mathSteps,
} = useConduitCalculator()

const conduitCategoryOptions = computed(() => {
  const cats = [...new Set(conduitData.map(c => c.category))]

  return cats.map(c => ({ value: c, label: c }))
})
</script>

<template>
  <ToolLayout
    :save-disabled="!result?.success || result?.partial"
    :save-function="handleSaveHistory"
    @reset="openResetModal"
  >
    <template #inputs>
      <ToolConduitInput
        v-model="inputs"
        :category-options="conduitCategoryOptions"
        @add-cable="addCable"
        @remove-cable="removeCable"
      />
    </template>

    <template #results>
      <ToolConduitResult :result="result" />
    </template>

    <template #basis>
      <ToolMathBasisModal :steps="mathSteps">
        <div class="p-basis-note">
          <strong>内線規程（勧告）</strong><br />
          3110-5
          管の屈曲が少なく、容易に電線を引き入れ及び引き替えることができる場合（48％）<br />
          3110-6 異なる太さの絶縁電線を同一管内に収める場合（32％）
        </div>
      </ToolMathBasisModal>
    </template>
  </ToolLayout>
</template>

<style scoped lang="scss">
.p-basis-note {
  @include text-meta;

  color: var(--color-status-warning);
}
</style>
