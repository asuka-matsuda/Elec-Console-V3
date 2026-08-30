<script setup lang="ts">
/**
 * VoltageCalculator
 * 電圧降下・ケーブルサイズ選定ツールのコンポーネントです。電圧降下の計算や、条件を満たすケーブルサイズの選定を行います。
 */
import { computed } from "vue";
import { useRoute } from "#app";
import { useForm, Field } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { modeOptions } from "~/constants/toolOptions";
import { getVoltageFormFields } from "~/constants/config/voltageFormConfig";
import { useVoltageCalculator } from "~/composables/tools/useVoltageCalculator";
import { useCalcHistory } from "~/composables/tools/useCalcHistory";
import { mapVoltageToHistory } from "~/utils/tools/voltage/historyMapper";
import { voltageSchema } from "~/utils/tools/voltage/voltageSchema";

useHead({
  title: "電圧降下・ケーブルサイズ選定",
});

const route = useRoute();
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
  openResetModal,
} = useVoltageCalculator();

const { saveHistory } = useCalcHistory("elec_calc_voltage_hist");

useForm({
  validationSchema: toTypedSchema(voltageSchema),
  initialValues: form.value,
});

const formFields = computed(() =>
  getVoltageFormFields(
    () => isDropCalcMode.value,
    () => isSizeCalcMode.value,
    () => computedAvailableSizes.value,
    () => !!form.value.cableType,
  ),
);

const handleSaveToHistory = async () => {
  if (!calcInputs.value.isReady) return;
  const toolName = (route.meta.title as string) || "電圧降下・ケーブルサイズ選定";
  const entry = mapVoltageToHistory(toolName, calcInputs.value, calcResult.value);
  await saveHistory(entry);
};
</script>

<template>
  <ToolLayout>
    <template #results>
      <ToolResultPanel
        title="計算結果"
        :save-disabled="!calcInputs.isReady"
        :save-function="handleSaveToHistory"
      >
        <ClientOnly>
          <ToolVoltageResult
            :inputs="calcInputs"
            :result="calcResult"
          />
        </ClientOnly>
      </ToolResultPanel>
    </template>

    <template #inputs>
      <ToolInputPanel @reset="openResetModal">
        <!-- 1. 計算モード切替 (AppRadioGroup) -->
        <AppRadioGroup
          v-model="form.mode"
          :options="modeOptions"
        />

        <div class="l-grid l-grid--2col">
          <template
            v-for="field in formFields"
            :key="field.id"
          >
            <Field 
              v-if="!field.showIf || field.showIf()"
              v-slot="{ errorMessage, handleChange, handleBlur }" 
              v-model="form[field.id]" 
              :name="field.id"
            >
              <AppFormGroup
                :label="field.label"
                :error="errorMessage"
                :class="`js-field-${field.id}`"
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
      </ToolInputPanel>
    </template>

    <template #basis>
      <ToolCalcBasisPanel :steps="mathSteps" />
    </template>
  </ToolLayout>

  <!-- リセット確認モーダル -->
  <AppConfirmModal
    v-model="isResetModalOpen"
    title="リセットの確認"
    message="入力した条件をすべてリセットしますか？"
    confirm-text="リセットする"
    @confirm="resetForm"
  />
</template>

<style scoped lang="scss">
/* 2カラムグリッドを再現 */
.l-grid {
  @include grid;

  &--2col {
    grid-template-columns: 1fr; // スモールファースト

    @include cq("sm") {
      // コンテナ幅が広い時は2カラム
      grid-template-columns: repeat(2, 1fr);
    }
  }
}
</style>
