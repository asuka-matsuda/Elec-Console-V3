<script setup lang="ts">
/**
 * VoltageCalculator
 * 電圧降下・ケーブルサイズ選定ツールのコンポーネントです。電圧降下の計算や、条件を満たすケーブルサイズの選定を行います。
 */
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
    () => computedAvailableSizes.value,
    () => !!form.value.cableType
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
        :save-function="handleSaveToHistory"
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
        </AppToolInputPanel>
    </template>

    <template #basis>
      <AppCalculationBasisPanel :steps="mathSteps" />
    </template>
    </AppToolLayout>

    <!-- リセット確認モーダル -->
    <AppConfirmModal v-model="isResetModalOpen" @confirm="resetForm" title="リセットの確認" message="入力した条件をすべてリセットしますか？" confirmText="リセットする" />
</template>

<style scoped lang="scss">
/* 2カラムグリッドを再現 */
.l-grid {
  // --- レイアウト・配置 ---
  @include grid;
  // --- モディファイア ---
  &--2col {
    // --- レイアウト・配置 ---
    grid-template-columns: 1fr; // スモールファースト

    @include cq("sm") {
      // コンテナ幅が広い時は2カラム

      // --- レイアウト・配置 ---
      grid-template-columns: repeat(2, 1fr);
    }
  }
}

/* ケーブル種別未選択時にケーブルサイズを無効化 */
.l-grid:has(.js-field-cableType [data-placeholder="true"]) .js-field-fixedSize {
  // --- 継承 ---
  @extend %disabled;
}
</style>
