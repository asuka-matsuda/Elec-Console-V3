<script setup lang="ts">
/**
 * 電線管サイズ選定計算画面
 * 配管サイズ自動選定ツールのコンポーネントです。収容するケーブルの種類と数から、適切な配管サイズを計算します。
 */
import { useConduitCalculator } from '~/composables/tools/useConduitCalculator'

useHead({
  title: '配管サイズ自動選定',
})

const {
  inputs,
  result,
  addCable,
  removeCable,
  isSaveDisabled,
  handleSaveHistory,
  openResetModal,
  mathSteps,
} = useConduitCalculator()
</script>

<template>
  <ToolCalculatorLayout
    :save-disabled="isSaveDisabled"
    :save-function="handleSaveHistory"
    @reset="openResetModal"
  >
    <template #inputs>
      <ToolInputConduit
        v-model="inputs"
        @add-cable="addCable"
        @remove-cable="removeCable"
      />
    </template>

    <template #results>
      <ToolResultConduit :result="result" />
    </template>

    <template #basis>
      <ToolMathBasis :steps="mathSteps" />
    </template>
  </ToolCalculatorLayout>
</template>
