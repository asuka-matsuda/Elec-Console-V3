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
  <div class="flex flex-col gap-form-row-gap">
    <RadioGroup v-model="form.mode" :options="modeOptions" />

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-form-col-gap gap-y-form-row-gap">
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
            :addon="field.type === 'input-addon' ? field.addonText : undefined"
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

            <div
              v-else-if="field.type === 'input-select'"
              class="flex items-center gap-inline-gap w-full min-w-0"
            >
              <Input
                v-model.number="form[field.id]"
                type="number"
                :placeholder="field.placeholder"
                :min="field.min"
                :step="field.step"
                class="flex-1 min-w-0"
                @blur="handleBlur"
              />

              <div
                v-if="field.secondaryId"
                class="w-24 shrink-0"
              >
                <Field
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
                    :error="secMeta.touched && !!secError"
                    @update:model-value="secChange"
                    @blur="secBlur"
                  />
                </Field>
              </div>
            </div>

            <Input
              v-else-if="field.type === 'input-addon'"
              v-model.number="form[field.id]"
              type="number"
              :placeholder="field.placeholder"
              :min="field.min"
              @blur="handleBlur"
            />
          </FormGroup>
        </Field>
      </template>
    </div>
  </div>
</template>
