<script setup lang="ts">
/**
 * VoltageInput
 * [Tool Organism] 電圧降下・ケーブルサイズ選定ツールの条件入力フォームコンポーネント。
 * 計算モード切替とグリッドレイアウトによる条件入力を提供します。
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
  <div class="flex flex-col gap-[var(--space-form-row-gap)]">
    <AtomsRadioGroup v-model="form.mode" :options="modeOptions" />

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-[var(--space-form-col-gap)] gap-y-[var(--space-form-row-gap)]">
      <template v-for="field in formFields" :key="field.id">
        <Field
          v-if="!field.showIf || field.showIf()"
          v-slot="{ errorMessage, meta, handleChange, handleBlur }"
          v-model="form[field.id]"
          :name="field.id"
        >
          <MoleculesFormGroup
            :label="field.label"
            :error="meta.touched ? errorMessage : undefined"
            :class="`js-field-${field.id}`"
          >
            <!-- 1. Select 単体 -->
            <AtomsSelect
              v-if="field.type === 'select'"
              v-model="form[field.id]"
              :options="field.options || []"
              :placeholder="field.placeholder"
              :disabled="field.disabled"
              :error="meta.touched && !!errorMessage"
              @update:model-value="handleChange"
              @blur="handleBlur"
            />

            <!-- 2. 数値入力 + セレクト -->
            <MoleculesInputGroup v-else-if="field.type === 'input-select'">
              <AtomsInput
                v-model.number="form[field.id]"
                type="number"
                :placeholder="field.placeholder"
                :min="field.min"
                :step="field.step"
                :error="meta.touched && !!errorMessage"
                @blur="handleBlur"
              />
              <template #append>
                <Field
                  v-if="field.secondaryId"
                  v-slot="{
                    errorMessage: secError,
                    meta: secMeta,
                    handleChange: secChange,
                    handleBlur: secBlur,
                  }"
                  v-model="form[field.secondaryId!]"
                  :name="field.secondaryId"
                >
                  <AtomsSelect
                    v-model="form[field.secondaryId!]"
                    :options="field.secondaryOptions || []"
                    :error="secMeta.touched && !!secError"
                    @update:model-value="secChange"
                    @blur="secBlur"
                  />
                </Field>
              </template>
            </MoleculesInputGroup>

            <!-- 3. 数値入力 + 単位アドオン -->
            <MoleculesInputGroup
              v-else-if="field.type === 'input-addon'"
              :addon="field.addonText"
            >
              <AtomsInput
                v-model.number="form[field.id]"
                type="number"
                :placeholder="field.placeholder"
                :min="field.min"
                :error="meta.touched && !!errorMessage"
                @blur="handleBlur"
              />
            </MoleculesInputGroup>
          </MoleculesFormGroup>
        </Field>
      </template>
    </div>
  </div>
</template>
