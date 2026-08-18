<script setup lang="ts">
import { computed } from "vue";
import { useLocalStorage } from "@vueuse/core";
import {
  calculateDesignCurrent,
  calculateLogic,
  generateMathData,
} from "~/utils/calcVoltageEngine";
import { systemData } from "~/utils/data/systemData";

import {
  modeOptions,
  phaseOptions,
  loadUnitOptions,
  powerFactorOptions,
  cableTypeOptions,
  coreOptions,
  fixedSizeOptions,
  parallelOptions,
  deratingOptions,
  ambientTempOptions,
  targetDropOptions,
} from "~/utils/constants/toolOptions"; // 空の構造
useHead({
  title: "電圧降下・ケーブルサイズ選定",
});

// 初期状態の定義
const defaultForm = {
  mode: "drop", // "drop" (電圧降下) | "size" (導体断面積)
  phase: "",
  loadValue: null as number | null,
  loadUnit: "A",
  powerFactor: "1.0",
  distance: null as number | null,
  cableType: "",
  cores: "",
  fixedSize: "",
  parallel: "1",
  derating: "1.0",
  ambientTemp: "none",
  targetDrop: "2",
};

// リアクティブステート（フォーム入力値・ローカルストレージで永続化）
const form = useLocalStorage("elec-calc-voltage-form", { ...defaultForm });
const isResetModalOpen = ref(false);

// フォームのリセット
const resetForm = () => {
  form.value = { ...defaultForm };
  isResetModalOpen.value = false;
};

// 表示制御用の算出プロパティ
const isSizeCalcMode = computed(() => form.value.mode === "size");
const isDropCalcMode = computed(() => form.value.mode === "drop");

// フォームフィールド設定のDRY化
type FormField = {
  id: keyof typeof defaultForm;
  label: string;
  type: "select" | "input-select" | "input-addon";
  options?: { label: string; value: string }[];
  placeholder?: string;
  min?: string;
  step?: string;
  addonText?: string;
  secondaryId?: keyof typeof defaultForm;
  secondaryOptions?: { label: string; value: string }[];
  showIf?: () => boolean;
};

const formFields = computed<FormField[]>(() => [
  {
    id: "phase",
    label: "配電方式・電圧",
    type: "select",
    options: phaseOptions,
    placeholder: "選択してください",
  },
  {
    id: "loadValue",
    label: "負荷",
    type: "input-select",
    placeholder: "入力してください",
    min: "0.1",
    step: "0.1",
    secondaryId: "loadUnit",
    secondaryOptions: loadUnitOptions,
  },
  {
    id: "powerFactor",
    label: "力率設定 (kW時)",
    type: "select",
    options: powerFactorOptions,
    placeholder: "選択してください",
  },
  {
    id: "distance",
    label: "配線距離 (L)",
    type: "input-addon",
    placeholder: "入力してください",
    min: "1",
    addonText: "m",
  },
  {
    id: "cableType",
    label: "使用ケーブル",
    type: "select",
    options: cableTypeOptions,
    placeholder: "選択してください",
  },
  {
    id: "cores",
    label: "芯数 指定",
    type: "select",
    options: coreOptions,
    placeholder: "選択してください",
    showIf: () => isSizeCalcMode.value,
  },
  {
    id: "fixedSize",
    label: "ケーブルサイズ 指定",
    type: "select",
    options: fixedSizeOptions,
    placeholder: "選択してください",
    showIf: () => isDropCalcMode.value,
  },
  {
    id: "parallel",
    label: "敷設条数",
    type: "select",
    options: parallelOptions,
    placeholder: "選択してください",
  },
  {
    id: "derating",
    label: "布設条件 (電流減少係数)",
    type: "select",
    options: deratingOptions,
    placeholder: "選択してください",
  },
  {
    id: "ambientTemp",
    label: "想定周囲温度",
    type: "select",
    options: ambientTempOptions,
    placeholder: "選択してください",
  },
  {
    id: "targetDrop",
    label: "目標（許容）電圧降下率",
    type: "select",
    options: targetDropOptions,
    placeholder: "選択してください",
    showIf: () => isSizeCalcMode.value,
  },
]);

// ---------------------------------
// 計算ロジック連動
// ---------------------------------

const calcInputs = computed(() => {
  const mode = form.value.mode;
  const sys = systemData.find((s) => s.id === form.value.phase) || null;
  const loadVal = form.value.loadValue || null;
  const loadUnit = form.value.loadUnit;
  const pf = parseFloat(form.value.powerFactor);
  const L = form.value.distance || null;
  const cableType = form.value.cableType || null;
  const rawSize = form.value.fixedSize || "";

  let selectedSize = null;
  let selectedCores = null;

  if (mode === "size") {
    selectedCores = form.value.cores || null;
  } else if (rawSize) {
    selectedSize = parseFloat(rawSize);
    selectedCores = form.value.cores || null;
  }

  const derating = parseFloat(form.value.derating);
  const rawTempVal = form.value.ambientTemp;
  const ambientTemp =
    rawTempVal && rawTempVal !== "none" ? parseFloat(rawTempVal) : null;
  const parallel = parseInt(form.value.parallel) || 1;
  const targetDrop = parseFloat(form.value.targetDrop) || null;

  const I = calculateDesignCurrent(sys, loadVal || 0, loadUnit, pf);

  const missing = [];
  if (!sys) missing.push("sys");
  if (!loadVal) missing.push("loadVal");
  if (!L) missing.push("L");
  if (!cableType) missing.push("cableType");
  if (!derating) missing.push("derating");
  if (mode === "drop" && !selectedSize) missing.push("selectedSize");

  return {
    mode,
    sys,
    I,
    L,
    cableType,
    selectedCores,
    derating,
    rawTempVal,
    ambientTemp,
    parallel,
    targetDrop,
    selectedSize,
    loadVal,
    loadUnit,
    pf,
    isReady: missing.length === 0,
    missingFields: missing,
  };
});

const calcResult = computed(() => {
  if (!calcInputs.value.isReady) return null;
  return calculateLogic(calcInputs.value);
});

const mathSteps = computed(() => {
  return generateMathData(calcInputs.value, calcResult.value) || [];
});
</script>

<template>
  <AppToolLayout>
    <template #disclaimer>
      <AppDisclaimer />
    </template>

    <template #results>
      <AppPanel
        bracket-color="tool"
        style="flex: 1; min-height: 0"
      >
        <template #header>
          <AppSectionHeader
            title="計算結果"
            divider-type="fade-center"
            icon="check-square"
            variant="tool"
            size="md"
          />
        </template>
        <div
          style="
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--color-text-muted);
          "
        >
          （結果エリア：後日実装）
        </div>
      </AppPanel>
    </template>

    <template #inputs>
      <AppPanel
        bracket-color="tool"
        style="flex: 1; min-height: 0"
      >
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
        bracket-color="reference"
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
