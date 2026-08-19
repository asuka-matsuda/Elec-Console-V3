import type { WeightCalcInputs, WeightCalcResult } from "./weightCalcLogic";
import type { HistoryEntry } from "../history/types";
import { formatCableName } from "../cableHelpers";
import { cableData } from "~/utils/data/cableData";

export function mapWeightToHistory(
  settings: WeightCalcInputs,
  result: WeightCalcResult
): Omit<HistoryEntry, "id" | "timestamp"> | null {
  if (result.error) return null;

  const cableDef = cableData.find(
    (cd: any) => cd.category === settings.category && cd.size === settings.size && cd.cores === settings.cores
  );
  
  const name = formatCableName(
    cableDef || { category: settings.category, size: settings.size, cores: settings.cores } as any,
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
      value: `${((result.cableWeight || 0) + parseFloat(result.bestDrum.weight)).toFixed(1)} kg`,
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
