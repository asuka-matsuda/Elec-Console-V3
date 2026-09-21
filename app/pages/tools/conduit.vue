<script setup lang="ts">
/**
 * ConduitCalculator
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
  <ToolTemplatesLayout
    :save-disabled="isSaveDisabled"
    :save-function="handleSaveHistory"
    @reset="openResetModal"
  >
    <template #inputs>
      <ToolConduitInput
        v-model="inputs"
        @add-cable="addCable"
        @remove-cable="removeCable"
      />
    </template>

    <template #results>
      <ToolConduitResult :result="result" />
    </template>

    <template #basis>
      <ToolMathBasis :steps="mathSteps" />
    </template>
  </ToolTemplatesLayout>
</template>
