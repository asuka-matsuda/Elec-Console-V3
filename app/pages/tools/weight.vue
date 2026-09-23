<script setup lang="ts">
/**
 * ケーブル重量・ドラム選定計算画面
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
  <ToolCalculatorLayout
    :save-disabled="isSaveDisabled"
    :save-function="handleSaveHistory"
    @reset="openResetModal"
  >
    <template #inputs>
      <ToolInputWeight v-model="inputs" />
    </template>

    <template #results>
      <ToolResultWeight :result="result" />
    </template>

    <template #basis>
      <ToolMathBasis :steps="mathSteps" />
    </template>
  </ToolCalculatorLayout>
</template>
