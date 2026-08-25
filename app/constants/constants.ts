import type { RadioOption } from "~/components/ui/AppRadioGroup.vue";

/**
 * 汎用的なトグル（あり / なし）
 */
export const TOGGLE_OPTIONS: RadioOption[] = [
  { label: "あり", value: "yes" },
  { label: "なし", value: "no" },
];

/**
 * 状態判定（良 / 不良 / 無）
 */
export const PHASE_STATUS_OPTIONS: RadioOption[] = [
  { label: "良", value: "good", color: "var(--color-status-success)" },
  { label: "不良", value: "bad", color: "var(--color-status-danger)" },
  { label: "無", value: "none", color: "var(--color-status-neutral)" },
];

/**
 * 計算モード（Drop / Size など）
 */
export const CALC_MODE_OPTIONS: RadioOption[] = [
  { label: "Drop", value: "drop" },
  { label: "Size", value: "size" },
];
