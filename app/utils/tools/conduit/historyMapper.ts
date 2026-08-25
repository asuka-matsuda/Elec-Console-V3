import type { ConduitCalcResult, CableInput } from "./conduitCalcLogic";
import type { HistoryEntry } from "~/types/history";
import { formatCableName } from "~/utils/cable";
import { cableData } from "~/constants/data/cableData";

export function mapConduitToHistory(
  conduitCategory: string,
  inputCables: CableInput[],
  result: ConduitCalcResult
): Omit<HistoryEntry, "id" | "timestamp"> | null {
  if (!result || result.partial || !result.success) return null;

  const inputs = [{ label: "配管種類", value: conduitCategory }];

  inputCables.forEach((c, i) => {
    let cableDef: any = undefined;
    if (c.cableIdx && c.cableIdx.startsWith('idx_')) {
      const idx = parseInt(c.cableIdx.replace('idx_', ''), 10);
      cableDef = cableData[idx];
    }
    const name = formatCableName(
      cableDef || { category: c.category, size: '', cores: '' } as any,
      true,
      false
    );
    inputs.push({
      label: `ケーブル ${i + 1}`,
      value: `${name} × ${c.count}本`,
    });
  });

  let status: HistoryEntry["status"] = "success";
  if (result.isOversize32 && result.isOversize48) {
    status = "error";
  } else if (result.isOversize32 || result.isOversize48) {
    status = "warning";
  }

  const size32Str = result.isOversize32
    ? "サイズ超過"
    : result.conduit32?.size || "---";
  const size48Str = result.isOversize48
    ? "サイズ超過"
    : result.conduit48?.size || "---";

  const results = [
    { label: "32%以下 (異種)", value: size32Str, isMain: true as boolean },
    {
      label: "占積率 (32%)",
      value: `${result.fill32?.toFixed(1) || 0}%`,
    },
    { label: "48%以下 (同種)", value: size48Str, isMain: true as boolean },
    {
      label: "占積率 (48%)",
      value: `${result.fill48?.toFixed(1) || 0}%`,
    },
    { label: "総断面積", value: `${result.totalArea.toFixed(1)} mm²` },
  ];

  return {
    toolName: "配管サイズ自動選定",
    status,
    mainResultText: `32%: ${size32Str} / 48%: ${size48Str}`,
    inputs,
    results,
  };
}
