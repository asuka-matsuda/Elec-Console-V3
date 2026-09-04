<script setup lang="ts">
/**
 * ToolVoltageInput
 * 電圧降下・ケーブルサイズ選定ツールの条件入力フォームコンポーネントです。
 * 計算モード切替と2等分グリッドによる条件入力を提供します。
 */
import { Field } from 'vee-validate'

import type { defaultForm } from '~/composables/tools/useVoltageCalculator'
import type { FormField } from '~/constants/config/voltageFormConfig'
import { modeOptions } from '~/constants/toolOptions'

const form = defineModel<typeof defaultForm>({ required: true })

defineProps<{
  formFields: FormField[]
}>()
</script>

<template>
  <div class="c-voltage-input">
    <AppRadioGroup v-model="form.mode" :options="modeOptions" />

    <div class="c-voltage-input__grid">
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
            <!-- 1. Select 単体 -->
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

            <!-- 2. 数値入力 + セレクト -->
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
                  v-slot="{
                    errorMessage: secError,
                    handleChange: secChange,
                    handleBlur: secBlur,
                  }"
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

            <!-- 3. 数値入力 + 単位アドオン -->
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
  </div>
</template>

<style scoped lang="scss">
.c-voltage-input {
  @include flex-start-stretch($direction: column);

  gap: var(--space-card-gap);

  &__grid {
    @include grid(repeat(2, minmax(0, 1fr)));

    @include mq("sm") {
      grid-template-columns: 1fr;
    }
  }
}
</style>
