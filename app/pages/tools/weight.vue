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
  isSaveDisabled,
  handleSaveHistory,
  openResetModal,
  mathSteps,
} = useWeightCalculator()
</script>

<template>
  <ToolTemplatesLayout
    :save-disabled="isSaveDisabled"
    :save-function="handleSaveHistory"
    @reset="openResetModal"
  >
    <template #inputs>
      <ToolWeightInput v-model="inputs" />
    </template>

    <template #results>
      <ToolOrganismsWeightResult :result="result" />
    </template>

    <template #basis>
      <ToolMathBasis :steps="mathSteps" />
    </template>
  </ToolTemplatesLayout>
</template>
