<script setup lang="ts">
import { computed } from "vue";
import { modeOptions } from "~/utils/constants/toolOptions";
import { useVoltageCalculator } from "~/composables/calc/useVoltageCalculator";
import { getVoltageFormFields } from "~/utils/config/voltageFormConfig";
import { useCalcHistory } from "~/composables/calc/useCalcHistory";
import { mapVoltageToHistory } from "~/utils/calc/voltage/historyMapper";
import { useForm, Field } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { voltageSchema } from '~/utils/calc/voltage/voltageSchema';

useHead({
  title: "電圧降下・ケーブルサイズ選定",
});

const {
  form,
  isResetModalOpen,
  resetForm,
  isSizeCalcMode,
  isDropCalcMode,
  computedAvailableSizes,
  calcInputs,
  calcResult,
  mathSteps,
  openResetModal
} = useVoltageCalculator();

useForm({
  validationSchema: toTypedSchema(voltageSchema),
  initialValues: form.value,
});

const formFields = computed(() =>
  getVoltageFormFields(
    () => isDropCalcMode.value,
    () => isSizeCalcMode.value,
    () => computedAvailableSizes.value
  )
);

const { saveHistory } = useCalcHistory("elec_calc_voltage_hist");
const route = useRoute();

const handleSaveToHistory = async () => {
  if (!calcInputs.value.isReady) return;
  const toolName = (route.meta.title as string) || "電圧降下・ケーブルサイズ選定";
  const entry = mapVoltageToHistory(toolName, calcInputs.value, calcResult.value);
  await saveHistory(entry);
};
</script>

<template>
  <AppToolLayout>


    <template #results>
      <AppToolResultPanel
        title="計算結果"
        :save-disabled="!calcInputs.isReady"
        @save="handleSaveToHistory"
      >
        <ClientOnly>
          <AppVoltageResult :inputs="calcInputs" :result="calcResult" />
        </ClientOnly>
      </AppToolResultPanel>
    </template>

    <template #inputs>
      <AppToolInputPanel @reset="openResetModal">
        <!-- 1. 計算モード切替 (AppRadioGroup) -->
        <AppRadioGroup v-model="form.mode" :options="modeOptions" />

        <div class="l-grid l-grid--2col">
          <template v-for="field in formFields" :key="field.id">
            <Field 
              v-if="!field.showIf || field.showIf()"
              v-slot="{ errorMessage, handleChange, handleBlur }" 
              v-model="form[field.id]" 
              :name="field.id"
            >
              <AppFormGroup
                :label="field.label"
                :error="errorMessage"
              >
                <!-- Select Only -->
                <AppSelect
                  v-if="field.type === 'select'"
                  v-model="form[field.id]"
                  :options="field.options || []"
                  :placeholder="field.placeholder"
                  :disabled="field.disabled"
                  :error="!!errorMessage"
                  @update:model-value="handleChange"
                  @blur="handleBlur"
                />

                <!-- Input + Select -->
                <AppInputGroup v-else-if="field.type === 'input-select'">
                  <AppInput
                    v-model.number="form[field.id]"
                    type="number"
                    :placeholder="field.placeholder"
                    :min="field.min"
                    :step="field.step"
                    :error="!!errorMessage"
                    @blur="handleBlur"
                  />
                  <template #append>
                    <Field
                      v-if="field.secondaryId"
                      v-slot="{ errorMessage: secError, handleChange: secChange, handleBlur: secBlur }"
                      v-model="form[field.secondaryId!]"
                      :name="field.secondaryId"
                    >
                      <AppSelect
                        v-model="form[field.secondaryId!]"
                        :options="field.secondaryOptions || []"
                        :error="!!secError"
                        @update:model-value="secChange"
                        @blur="secBlur"
                      />
                    </Field>
                  </template>
                </AppInputGroup>

                <!-- Input + Addon -->
                <AppInputGroup v-else-if="field.type === 'input-addon'">
                  <AppInput
                    v-model.number="form[field.id]"
                    type="number"
                    :placeholder="field.placeholder"
                    :min="field.min"
                    :error="!!errorMessage"
                    @blur="handleBlur"
                  />
                  <template #append>
                    <span class="c-input-addon">{{ field.addonText }}</span>
                  </template>
                </AppInputGroup>
              </AppFormGroup>
            </Field>
          </template>
        </div>
        </AppToolInputPanel>
    </template>

    <template #basis>
      <AppCalculationBasisPanel :steps="mathSteps" />
    </template>
  </AppToolLayout>

  <!-- Reset Confirmation Modal -->
  <AppToolResetModal v-model="isResetModalOpen" @confirm="resetForm" />
</template>

<style scoped lang="scss">
/* 2カラムグリッドを再現 (PCファースト) */
.l-grid {
  display: grid;
  gap: var(--gap-component);

  &--2col {
    grid-template-columns: repeat(2, 1fr); // PCのデフォルトは2カラム

    @include mq("md") {
      // スマホサイズに縮んだ時だけ1カラムに上書き
      grid-template-columns: 1fr;
    }
  }
}

</style>
