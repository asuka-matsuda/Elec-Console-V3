<script setup lang="ts">
/**
 * RackCalculator
 * ケーブルラック選定ツールのコンポーネントです。強電・弱電ケーブルのリストと段積み数から最適なラック幅を選定します。
 */
import { useRackCalculator } from '~/composables/tools/useRackCalculator'

useHead({
  title: 'ケーブルラック選定',
})

const {
  inputs,
  result,
  isSaveDisabled,
  addStrongCable,
  removeStrongCable,
  addWeakCable,
  removeWeakCable,
  handleSaveHistory,
  openResetModal,
  mathSteps,
} = useRackCalculator()
</script>

<template>
  <ToolTemplatesLayout
    results-title="選定結果"
    :save-disabled="isSaveDisabled"
    :save-function="handleSaveHistory"
    @reset="openResetModal"
  >
    <template #inputs>
      <ToolRackInput
        v-model="inputs"
        @add-strong-cable="addStrongCable"
        @remove-strong-cable="removeStrongCable"
        @add-weak-cable="addWeakCable"
        @remove-weak-cable="removeWeakCable"
      />
    </template>

    <template #results>
      <ToolRackResult :result="result" />
    </template>

    <template #basis>
      <ToolMathBasis :steps="mathSteps" />
    </template>
  </ToolTemplatesLayout>
</template>
