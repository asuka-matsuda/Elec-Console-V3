<script setup lang="ts">
/**
 * VoltageCalculator
 * 電圧降下・ケーブルサイズ選定ツールのコンポーネントです。電圧降下の計算や、条件を満たすケーブルサイズの選定を行います。
 */
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { computed } from 'vue'

import { useRoute } from '#app'
import { useCalcHistory } from '~/composables/tools/useCalcHistory'
import { useVoltageCalculator } from '~/composables/tools/useVoltageCalculator'
import { getVoltageFormFields } from '~/constants/config/voltageFormConfig'
import { mapVoltageToHistory } from '~/utils/tools/voltage/historyMapper'
import { voltageSchema } from '~/utils/tools/voltage/voltageSchema'

useHead({
  title: '電圧降下・ケーブルサイズ選定',
})

const route = useRoute()
const {
  form,
  isSizeCalcMode,
  isDropCalcMode,
  computedAvailableSizes,
  calcInputs,
  calcResult,
  mathSteps,
  openResetModal,
} = useVoltageCalculator()

const { saveHistory } = useCalcHistory('elec_calc_voltage_hist')

useForm({
  validationSchema: toTypedSchema(voltageSchema),
  initialValues: form.value,
})

const formFields = computed(() =>
  getVoltageFormFields(
    () => isDropCalcMode.value,
    () => isSizeCalcMode.value,
    () => computedAvailableSizes.value,
    () => !!form.value.cableType,
  ),
)

const handleSaveToHistory = async () => {
  if (!calcInputs.value.isReady) return
  const toolName
    = (route.meta.title as string) || '電圧降下・ケーブルサイズ選定'
  const entry = mapVoltageToHistory(
    toolName,
    calcInputs.value,
    calcResult.value,
  )

  await saveHistory(entry)
}
</script>

<template>
  <ToolLayout
    results-title="計算結果"
    :save-disabled="!calcInputs.isReady"
    :save-function="handleSaveToHistory"
    @reset="openResetModal"
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
