<script setup lang="ts">
/**
 * VoltageCalculator
 * 電圧降下・ケーブルサイズ選定ツールのコンポーネントです。電圧降下の計算や、条件を満たすケーブルサイズの選定を行います。
 */
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { computed } from 'vue'

import { defaultForm, useVoltageCalculator } from '~/composables/tools/useVoltageCalculator'
import { getVoltageFormFields } from '~/constants/config/voltageFormConfig'
import { voltageSchema } from '~/utils/tools/voltage/voltageSchema'

useHead({
  title: '電圧降下・ケーブルサイズ選定',
})

const {
  form,
  isSizeCalcMode,
  isDropCalcMode,
  computedAvailableSizes,
  calcInputs,
  calcResult,
  mathSteps,
  openResetModal,
  handleSaveHistory,
  isSinglePhase,
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

const formFields = computed(() =>
  getVoltageFormFields(
    () => isDropCalcMode.value,
    () => isSizeCalcMode.value,
    () => computedAvailableSizes.value,
    () => !!form.value.cableType,
    () => isSinglePhase.value,
  ),
)
</script>

<template>
  <ToolLayout
    results-title="計算結果"
    :save-disabled="!calcInputs.isReady"
    :save-function="handleSaveHistory"
    @reset="handleReset"
  >
    <template #inputs>
      <ToolVoltageInput v-model="form" :form-fields="formFields" />
    </template>

    <template #results>
      <ClientOnly>
        <ToolVoltageResult :inputs="calcInputs" :result="calcResult" />
      </ClientOnly>
    </template>

    <template #basis>
      <ToolMathBasisModal :steps="mathSteps" />
    </template>
  </ToolLayout>
</template>
