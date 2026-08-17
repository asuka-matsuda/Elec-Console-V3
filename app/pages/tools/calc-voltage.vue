<script setup lang="ts">
import { reactive, computed, watch } from "vue";
import { calculateDesignCurrent, calculateLogic, generateMathData } from "~/utils/calcVoltageEngine";
import { systemData } from "~/utils/data/systemData";// 空の構造
useHead({
  title: "電圧降下・ケーブルサイズ選定",
});

// リアクティブステート（フォーム入力値）
const form = reactive({
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
});

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
} from "~/utils/constants/toolOptions";

// 表示制御用の算出プロパティ
const isSizeCalcMode = computed(() => form.mode === "size");
const isDropCalcMode = computed(() => form.mode === "drop");

// フォームフィールド設定のDRY化
type FormField = {
  id: keyof typeof form;
  label: string;
  type: "select" | "input-select" | "input-addon";
  options?: { label: string; value: string }[];
  placeholder?: string;
  min?: string;
  step?: string;
  addonText?: string;
  secondaryId?: keyof typeof form;
  secondaryOptions?: { label: string; value: string }[];
  showIf?: () => boolean;
};

const formFields = computed<FormField[]>(() => [
  { id: "phase", label: "配電方式・電圧", type: "select", options: phaseOptions, placeholder: "選択してください" },
  { id: "loadValue", label: "負荷", type: "input-select", placeholder: "入力してください", min: "0.1", step: "0.1", secondaryId: "loadUnit", secondaryOptions: loadUnitOptions },
  { id: "powerFactor", label: "力率設定 (kW時)", type: "select", options: powerFactorOptions, placeholder: "選択してください" },
  { id: "distance", label: "配線距離 (L)", type: "input-addon", placeholder: "入力してください", min: "1", addonText: "m" },
  { id: "cableType", label: "使用ケーブル", type: "select", options: cableTypeOptions, placeholder: "選択してください" },
  { id: "cores", label: "芯数 指定", type: "select", options: coreOptions, placeholder: "選択してください", showIf: () => isSizeCalcMode.value },
  { id: "fixedSize", label: "ケーブルサイズ 指定", type: "select", options: fixedSizeOptions, placeholder: "選択してください", showIf: () => isDropCalcMode.value },
  { id: "parallel", label: "敷設条数", type: "select", options: parallelOptions, placeholder: "選択してください" },
  { id: "derating", label: "布設条件 (電流減少係数)", type: "select", options: deratingOptions, placeholder: "選択してください" },
  { id: "ambientTemp", label: "想定周囲温度", type: "select", options: ambientTempOptions, placeholder: "選択してください" },
  { id: "targetDrop", label: "目標（許容）電圧降下率", type: "select", options: targetDropOptions, placeholder: "選択してください", showIf: () => isSizeCalcMode.value },
]);

// ---------------------------------
// 計算ロジック連動
// ---------------------------------

const calcInputs = computed(() => {
  const mode = form.mode;
  const sys = systemData.find(s => s.id === form.phase) || null;
  const loadVal = form.loadValue || null;
  const loadUnit = form.loadUnit;
  const pf = parseFloat(form.powerFactor);
  const L = form.distance || null;
  const cableType = form.cableType || null;
  const rawSize = form.fixedSize || "";
  
  let selectedSize = null;
  let selectedCores = null;

  if (mode === "size") {
    selectedCores = form.cores || null;
  } else if (rawSize) {
    selectedSize = parseFloat(rawSize);
    selectedCores = form.cores || null;
  }

  const derating = parseFloat(form.derating);
  const rawTempVal = form.ambientTemp;
  const ambientTemp = rawTempVal && rawTempVal !== "none" ? parseFloat(rawTempVal) : null;
  const parallel = parseInt(form.parallel) || 1;
  const targetDrop = parseFloat(form.targetDrop) || null;

  const I = calculateDesignCurrent(sys, loadVal || 0, loadUnit, pf);

  const missing = [];
  if (!sys) missing.push("sys");
  if (!loadVal) missing.push("loadVal");
  if (!L) missing.push("L");
  if (!cableType) missing.push("cableType");
  if (!derating) missing.push("derating");
  if (mode === "drop" && !selectedSize) missing.push("selectedSize");

  return {
    mode, sys, I, L, cableType, selectedCores, derating, rawTempVal, ambientTemp, parallel, targetDrop, selectedSize, loadVal, loadUnit, pf,
    isReady: missing.length === 0,
    missingFields: missing
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
        variant="hud"
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
      <AppPanel variant="hud" bracket-color="tool" style="flex: 1; min-height: 0">
        <template #header>
          <AppSectionHeader
            title="条件入力"
            divider-type="fade-center"
            icon="edit"
            variant="tool"
            size="md"
          />
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
                v-model="(form[field.id] as any)"
                :options="field.options || []"
                :placeholder="field.placeholder"
              />

              <!-- Input + Select -->
              <AppInputGroup v-else-if="field.type === 'input-select'">
                <AppInput
                  v-model.number="(form[field.id] as any)"
                  type="number"
                  :placeholder="field.placeholder"
                  :min="field.min"
                  :step="field.step"
                />
                <template #append>
                  <AppSelect
                    v-if="field.secondaryId"
                    v-model="(form[field.secondaryId] as any)"
                    :options="field.secondaryOptions || []"
                    style="width: 80px; flex-shrink: 0"
                  />
                </template>
              </AppInputGroup>

              <!-- Input + Addon -->
              <AppInputGroup v-else-if="field.type === 'input-addon'">
                <AppInput
                  v-model.number="(form[field.id] as any)"
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
      <AppPanel variant="hud" bracket-color="tool" class="c-basis-panel" style="flex: 1; min-height: 0">
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
