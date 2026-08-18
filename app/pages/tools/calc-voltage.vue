<script setup lang="ts">
import { computed } from "vue";
import { modeOptions } from "~/utils/constants/toolOptions";
import { useVoltageCalculator } from "~/composables/calc/useVoltageCalculator";
import { getVoltageFormFields } from "~/utils/config/voltageFormConfig";

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
} = useVoltageCalculator();

const formFields = computed(() =>
  getVoltageFormFields(
    () => isDropCalcMode.value,
    () => isSizeCalcMode.value,
    () => computedAvailableSizes.value
  )
);
</script>

<template>
  <AppToolLayout>
    <template #disclaimer>
      <AppDisclaimer />
    </template>

    <template #results>
      <AppPanel bracket-color="tool" style="flex: 1; min-height: 0">
        <template #header>
          <AppSectionHeader
            title="計算結果"
            divider-type="fade-center"
            icon="check-square"
            variant="tool"
            size="md"
          />
        </template>
        <AppVoltageResult :inputs="calcInputs" :result="calcResult" />
      </AppPanel>
    </template>

    <template #inputs>
      <AppPanel bracket-color="tool" style="flex: 1; min-height: 0">
        <template #header>
          <AppSectionHeader
            title="条件入力"
            divider-type="fade-center"
            icon="edit"
            variant="tool"
            size="md"
          >
            <template #actions>
              <AppButtonDanger size="sm" @click="isResetModalOpen = true">
                <AppIcon name="refresh-cw" size="sm" />
                リセット
              </AppButtonDanger>
            </template>
          </AppSectionHeader>
        </template>
        <!-- 1. 計算モード切替 (AppRadioGroup) -->
        <AppRadioGroup v-model="form.mode" :options="modeOptions" />

        <div class="l-grid l-grid--2col">
          <template v-for="field in formFields" :key="field.id">
            <AppFormGroup
              v-if="!field.showIf || field.showIf()"
              :label="field.label"
            >
              <!-- Select Only -->
              <AppSelect
                v-if="field.type === 'select'"
                v-model="form[field.id]"
                :options="field.options || []"
                :placeholder="field.placeholder"
                :disabled="field.disabled"
              />

              <!-- Input + Select -->
              <AppInputGroup v-else-if="field.type === 'input-select'">
                <AppInput
                  v-model.number="form[field.id]"
                  type="number"
                  :placeholder="field.placeholder"
                  :min="field.min"
                  :step="field.step"
                />
                <template #append>
                  <AppSelect
                    v-if="field.secondaryId"
                    v-model="form[field.secondaryId]"
                    :options="field.secondaryOptions || []"
                  />
                </template>
              </AppInputGroup>

              <!-- Input + Addon -->
              <AppInputGroup v-else-if="field.type === 'input-addon'">
                <AppInput
                  v-model.number="form[field.id]"
                  type="number"
                  :placeholder="field.placeholder"
                  :min="field.min"
                />
                <template #append>
                  <span class="c-input-addon">{{ field.addonText }}</span>
                </template>
              </AppInputGroup>
            </AppFormGroup>
          </template>
        </div>
      </AppPanel>
    </template>

    <template #basis>
      <AppPanel
        bracket-color="tool"
        class="c-basis-panel"
        style="flex: 1; min-height: 0"
      >
        <template #header>
          <AppSectionHeader
            title="計算根拠"
            divider-type="fade-center"
            icon="book"
            variant="tool"
            size="md"
          />
        </template>

        <AppMathBasis :steps="mathSteps" />

        <!-- Reset Confirmation Modal -->
        <AppModal
          v-model="isResetModalOpen"
          title="入力条件のリセット"
          icon="alert-triangle"
          variant="danger"
        >
          <p>
            これまでに入力したすべての条件が初期化されます。<br />
            本当によろしいですか？
          </p>
          <template #footer>
            <AppButtonSecondary @click="isResetModalOpen = false">
              キャンセル
            </AppButtonSecondary>
            <AppButtonDanger @click="resetForm">
              <AppIcon name="trash-2" size="sm" />
              リセットする
            </AppButtonDanger>
          </template>
        </AppModal>
      </AppPanel>
    </template>
  </AppToolLayout>
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

/* 計算根拠エリアはスマホ表示時にカット */
.c-basis-panel {
  @include mq("md") {
    display: none !important;
  }
}
</style>
