<script setup lang="ts">
/**
 * 電圧降下・許容電流計算画面
 * 電圧降下・ケーブルサイズ選定ツールのコンポーネントです。電圧降下の計算や、条件を満たすケーブルサイズの選定を行います。
 */
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'

import { defaultForm, useVoltageCalculator } from '~/composables/tools/useVoltageCalculator'
import { voltageSchema } from '~/utils/tools/voltage/voltageSchema'

useHead({
  title: '電圧降下・ケーブルサイズ選定',
})

const {
  form,
  formFields,
  isSaveDisabled,
  calcInputs,
  calcResult,
  mathSteps,
  openResetModal,
  handleSaveHistory,
} = useVoltageCalculator()

const { resetForm: resetVeeValidate } = useForm({
  validationSchema: toTypedSchema(voltageSchema),
  initialValues: form.value,
})

const handleReset = async () => {
  const confirmed = await openResetModal()

  if (confirmed) {
    resetVeeValidate({
      values: JSON.parse(JSON.stringify(defaultForm)),
    })
  }
}
</script>

<template>
  <ToolCalculatorLayout
    results-title="計算結果"
    :save-disabled="isSaveDisabled"
    :save-function="handleSaveHistory"
    @reset="handleReset"
  >
    <template #inputs>
      <ToolInputVoltage v-model="form" :form-fields="formFields" />
    </template>

    <template #results>
      <ToolResultVoltage :inputs="calcInputs" :result="calcResult" />
    </template>

    <template #basis>
      <ToolMathBasis :steps="mathSteps" />
    </template>
  </ToolCalculatorLayout>
</template>
