<script setup lang="ts">
/**
 * WeightCalculator
 * ケーブル重量・ドラム選定ツールのコンポーネントです。
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
  <ToolLayout
    :save-disabled="result?.error"
    :save-function="handleSaveHistory"
    @reset="openResetModal"
  >
    <template #inputs>
      <ToolWeightInput v-model="inputs" />
    </template>

    <template #results>
      <ToolWeightResult :result="result" />
    </template>

    <template #basis>
      <ToolMathBasisModal :steps="mathSteps" />
    </template>
  </ToolLayout>
</template>
