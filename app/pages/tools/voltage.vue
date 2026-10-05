<script setup lang="ts">
/**
 * 電圧降下・許容電流計算画面
 * 電圧降下・ケーブルサイズ選定ツールのコンポーネントです。電圧降下の計算や、条件を満たすケーブルサイズの選定を行います。
 */
import { toTypedSchema } from '@vee-validate/zod'
import { Field, useForm } from 'vee-validate'
import { onUnmounted, ref } from 'vue'

import { defaultForm, useVoltageCalculator } from '~/composables/tools/useVoltageCalculator'
import { modeOptions } from '~/constants/toolOptions'
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

// 計算根拠の表示切り替え
const isShowingBasis = ref(false)

// 保存フィードバック
const saveState = ref<'idle' | 'saving' | 'success' | 'error'>('idle')
let resetTimer: ReturnType<typeof setTimeout> | null = null

const clearTimer = () => {
  if (resetTimer) {
    clearTimeout(resetTimer)
    resetTimer = null
  }
}

onUnmounted(clearTimer)

const handleSave = async () => {
  if (isSaveDisabled.value || saveState.value !== 'idle') return

  clearTimer()
  saveState.value = 'saving'
  try {
    await handleSaveHistory()
    saveState.value = 'success'
    resetTimer = setTimeout(() => {
      saveState.value = 'idle'
      resetTimer = null
    }, 2000)
  }
  catch (e) {
    console.error('Save failed:', e)
    saveState.value = 'error'
    resetTimer = setTimeout(() => {
      saveState.value = 'idle'
      resetTimer = null
    }, 3000)
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-panel-gap min-h-0 w-full max-w-[1600px] mx-auto">
    <Alert variant="warning" text="免責事項: 本ツールによる計算結果は、規程に基づいた理論値（目安）です。選定や安全性については、必ず設計者自身の責任において各種関連法規・規程をご確認の上ご判断ください。" />

    <div class="grid flex-1 grid-cols-1 md:grid-cols-[minmax(0,4fr)_minmax(0,3fr)] gap-panel-gap min-h-0">
      <section class="panel flex flex-1 flex-col gap-panel-gap min-h-0">
        <header class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap">
          <h3 class="flex items-center gap-item-gap">
            <Icon name="edit" style="color: var(--color-category-tool)" />
            <span>条件入力</span>
          </h3>
          <div class="flex items-center gap-item-gap">
            <Button variant="secondary" size="sm" icon="refresh-cw" @click="handleReset">入力をリセットする</Button>
          </div>
        </header>
        <hr class="divider">

        <form class="flex flex-1 flex-col gap-form-row-gap min-h-0 overflow-y-auto" @submit.prevent>
          <nav class="radio-group">
            <button v-for="opt in modeOptions" :key="String(opt.value)" type="button" class="radio-group-item" :class="{ 'is-active': form.mode === opt.value }" @click="form.mode = opt.value">{{ opt.label }}</button>
          </nav>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-form-col-gap gap-y-form-row-gap">
            <template v-for="field in formFields" :key="field.id">
              <Field v-if="!field.showIf || field.showIf()" v-slot="{ errorMessage, meta, handleChange, handleBlur }" v-model="form[field.id]" :name="field.id">
                <div :class="['flex flex-col gap-inline-gap', `js-field-${field.id}`]">
                  <label :for="`voltage-field-${field.id}`" class="label">{{ field.label }}</label>

                  <Select v-if="field.type === 'select'" :id="`voltage-field-${field.id}`" v-model="form[field.id]" :options="field.options || []" :placeholder="field.placeholder" :disabled="field.disabled" :error="meta.touched && !!errorMessage" @update:model-value="handleChange" @blur="handleBlur" />

                  <div v-else-if="field.type === 'input-select'" class="flex items-center gap-inline-gap w-full min-w-0">
                    <Input :id="`voltage-field-${field.id}`" v-model.number="form[field.id]" type="number" :placeholder="field.placeholder" :min="field.min" :step="field.step" :error="meta.touched && !!errorMessage" class="flex-1 min-w-0" @blur="handleBlur" />

                    <div v-if="field.secondaryId" class="w-24 shrink-0">
                      <Field v-slot="{ errorMessage: secError, meta: secMeta, handleChange: secChange, handleBlur: secBlur }" v-model="form[field.secondaryId!]" :name="field.secondaryId">
                        <Select v-model="form[field.secondaryId!]" :options="field.secondaryOptions || []" :error="secMeta.touched && !!secError" @update:model-value="secChange" @blur="secBlur" />
                      </Field>
                    </div>
                  </div>

                  <div v-else-if="field.type === 'input-addon'" class="flex items-center gap-inline-gap w-full min-w-0">
                    <Input :id="`voltage-field-${field.id}`" v-model.number="form[field.id]" type="number" :placeholder="field.placeholder" :min="field.min" :error="meta.touched && !!errorMessage" class="flex-1 min-w-0" @blur="handleBlur" />
                    <span v-if="field.addonText" class="shrink-0 form-addon">{{ field.addonText }}</span>
                  </div>

                  <p v-if="meta.touched && errorMessage" class="error-text">
                    {{ errorMessage }}
                  </p>
                </div>
              </Field>
            </template>
          </div>
        </form>
      </section>

      <section class="panel flex flex-1 flex-col gap-panel-gap min-h-0">
        <header class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap">
          <h3 class="flex items-center gap-item-gap">
            <Icon :name="isShowingBasis ? 'book' : 'check-square'" style="color: var(--color-category-tool)" />
            <span>{{ isShowingBasis ? '計算根拠' : '計算結果' }}</span>
          </h3>
          <div class="flex items-center gap-item-gap">
            <Button v-if="mathSteps?.length" variant="tertiary" size="sm" :icon="isShowingBasis ? 'arrow-left' : 'circle-help'" @click="isShowingBasis = !isShowingBasis">{{ isShowingBasis ? '計算結果に戻る' : '計算根拠を表示' }}</Button>
            <Button v-if="!isShowingBasis" variant="primary" size="sm" icon="save" :disabled="isSaveDisabled || saveState !== 'idle'" :loading="saveState === 'saving'" @click="handleSave">履歴に保存する</Button>
          </div>
        </header>
        <hr class="divider">

        <div class="flex flex-1 flex-col min-h-0 overflow-y-auto">
          <ToolResultVoltage v-if="!isShowingBasis" :inputs="calcInputs" :result="calcResult" />
          <ToolMathBasis v-else :steps="mathSteps" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.form-addon {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.error-text {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-status-danger);
}
</style>
