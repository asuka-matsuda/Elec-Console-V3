import type { WeightCalcInputs, WeightCalcResult } from "./weightCalcLogic";
import type { HistoryEntry } from "~/types/history";
import type { CableData } from '~/types/database';
import { formatCableName } from "~/utils/cable";
import { cableData } from "~/constants/data/cableData";

export function mapWeightToHistory(
  settings: WeightCalcInputs,
  result: WeightCalcResult
): Omit<HistoryEntry, "id" | "timestamp"> | null {
  if (result.error) return null;

  let cableDef: CableData | undefined = undefined;
  if (settings.cableIdx && settings.cableIdx.startsWith('idx_')) {
    const idx = parseInt(settings.cableIdx.replace('idx_', ''), 10);
    cableDef = cableData[idx];
  }
  
  const name = formatCableName(
    cableDef || { category: settings.category, size: '', cores: '' } as CableData,
    true,
    false
  );

  const inputs = [
    { label: "対象ケーブル", value: name },
    { label: "ケーブル長", value: `${settings.L_input} m` },
    { label: "占積率 (K)", value: `${((settings.K ?? 0) * 100).toFixed(0)}%` },
  ];

  let status: HistoryEntry["status"] = "success";
  if (!result.bestDrum) {
    status = "error";
  }

  const results: { label: string; value: string; isMain?: boolean; color?: string }[] = [
    {
      label: "ケーブル総重量",
      value: `${result.cableWeight?.toFixed(1)} kg`,
      isMain: true,
    },
    {
      label: "推奨ドラム",
      value: result.bestDrum ? `${result.bestDrum.category} (${result.bestDrum.id})` : "選定不可",
      isMain: true,
    },
  ];

  if (result.bestDrum) {
    results.push({
      label: "ドラム空重量",
      value: `${result.bestDrum.weight} kg`,
    });
    results.push({
      label: "総重量 (ケーブル+ドラム)",
      value: `${((result.cableWeight || 0) + Number(result.bestDrum.weight)).toFixed(1)} kg`,
    });
    results.push({
      label: "最大巻取可能長",
      value: `${result.maxCapacityMeters?.toFixed(1)} m`,
    });
  }

  return {
    toolName: "ケーブル重量・ドラム選定",
    status,
    mainResultText: `${result.cableWeight?.toFixed(1)}kg / ドラム: ${result.bestDrum ? result.bestDrum.id : "不可"}`,
    inputs,
    results,
  };
}
