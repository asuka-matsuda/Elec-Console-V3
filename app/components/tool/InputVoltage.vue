<script setup lang="ts">
/**
 * InputVoltage
 * [Tool Organism] 電圧降下・ケーブルサイズ選定ツールの条件入力フォームコンポーネント。
 * 計算モード切替とグリッドレイアウトによる条件入力を提供します。
 */
import { Field } from 'vee-validate'

import { modeOptions } from '~/constants/toolOptions'
import type { FormField } from '~/utils/tools/voltage/voltageFormConfig'
import type { VoltageFormState } from '~/utils/tools/voltage/voltageMapper'

const form = defineModel<VoltageFormState>({ required: true })

defineProps<{
  formFields: FormField[]
}>()
</script>

<template>
  <div class="flex flex-col gap-[var(--space-form-row-gap)]">
    <RadioGroup v-model="form.mode" :options="modeOptions" />

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-[var(--space-form-col-gap)] gap-y-[var(--space-form-row-gap)]">
      <template v-for="field in formFields" :key="field.id">
        <Field
          v-if="!field.showIf || field.showIf()"
          v-slot="{ errorMessage, meta, handleChange, handleBlur }"
          v-model="form[field.id]"
          :name="field.id"
        >
          <FormGroup
            :label="field.label"
            :error="meta.touched ? errorMessage : undefined"
            :class="`js-field-${field.id}`"
          >

            <Select
              v-if="field.type === 'select'"
              v-model="form[field.id]"
              :options="field.options || []"
              :placeholder="field.placeholder"
              :disabled="field.disabled"
              @update:model-value="handleChange"
              @blur="handleBlur"
            />

            <Input
              v-else-if="field.type === 'input-select'"
              v-model.number="form[field.id]"
              type="number"
              :placeholder="field.placeholder"
              :min="field.min"
              :step="field.step"
              :clearable="false"
              @blur="handleBlur"
            >
              <template #addon>
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
                  <Select
                    v-model="form[field.secondaryId!]"
                    :options="field.secondaryOptions || []"
                    :clearable="false"
                    :error="secMeta.touched && !!secError"
                    @update:model-value="secChange"
                    @blur="secBlur"
                  />
                </Field>
              </template>
            </Input>

            <Input
              v-else-if="field.type === 'input-addon'"
              v-model.number="form[field.id]"
              type="number"
              :placeholder="field.placeholder"
              :min="field.min"
              :addon="field.addonText"
              :clearable="false"
              @blur="handleBlur"
            />
          </FormGroup>
        </Field>
      </template>
    </div>
  </div>
</template>
