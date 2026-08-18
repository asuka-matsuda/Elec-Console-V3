import {
  phaseOptions,
  loadUnitOptions,
  powerFactorOptions,
  cableTypeOptions,
  parallelOptions,
  deratingOptions,
  ambientTempOptions,
  targetDropOptions,
} from "~/utils/constants/toolOptions";

import type { defaultForm } from "~/composables/calc/useVoltageCalculator";

export type FormField = {
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
  disabled?: boolean;
};

export function getVoltageFormFields(
  isDropCalcMode: () => boolean,
  isSizeCalcMode: () => boolean,
  computedAvailableSizes: () => { label: string; value: string }[]
): FormField[] {
  return [
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
      id: "fixedSize",
      label: "ケーブルサイズ 指定",
      type: "select",
      options: computedAvailableSizes(),
      placeholder: "選択してください",
      showIf: isDropCalcMode,
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
      showIf: isSizeCalcMode,
    },
  ];
}
