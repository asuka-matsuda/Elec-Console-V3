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
  maxDepth,
  result,
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
  <ToolLayout
    results-title="選定結果"
    :save-disabled="result?.error || (!inputs.isStrong && !inputs.isWeak)"
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
      <ToolRackResult
        :result="result"
        :max-depth="maxDepth"
        :is-strong="inputs.isStrong"
        :is-weak="inputs.isWeak"
      />
    </template>

    <template #basis>
      <ToolMathBasisModal :steps="mathSteps" />
    </template>
  </ToolLayout>
</template>
