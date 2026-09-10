<script setup lang="ts">
/**
 * WeightCalculator
 * ケーブル重量・ドラム選定ツールのページコンポーネントです。
 */
import { useWeightCalculator } from '~/composables/tools/useWeightCalculator'

useHead({
  title: 'ケーブル重量・ドラム選定',
})

const {
  inputs,
  result,
  handleSaveHistory,
  openResetModal,
  mathSteps,
} = useWeightCalculator()
</script>

<template>
  <ToolTemplatesLayout
    :save-disabled="result?.error"
    :save-function="handleSaveHistory"
    @reset="openResetModal"
  >
    <template #inputs>
      <ToolOrganismsWeightInput v-model="inputs" />
    </template>

    <template #results>
      <ToolOrganismsWeightResult :result="result" />
    </template>

    <template #basis>
      <ToolOrganismsMathBasisModal :steps="mathSteps" />
    </template>
  </ToolTemplatesLayout>
</template>
