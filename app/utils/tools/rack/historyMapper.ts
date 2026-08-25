import type { RackCalcResult } from "./rackCalcLogic";
import type { HistoryEntry } from "~/types/history";
import { formatCableName } from "~/utils/cable";
import { cableData } from "~/constants/data/cableData";
import type { RackCableUIInput } from "~/utils/tools/rack/rackMapper";

export function mapRackToHistory(
  settings: {
    isStrong: boolean;
    isWeak: boolean;
    lStrong: number;
    lWeak: number;
    rackHeight: number;
    maxDepth: number;
    separatorWidth: number;
  },
  strongCables: RackCableUIInput[],
  weakCables: RackCableUIInput[],
  result: RackCalcResult
): Omit<HistoryEntry, "id" | "timestamp"> | null {
  if (result.error || result.totalWidth === 0) return null;

  const inputs: { label: string; value: string }[] = [];

  inputs.push({
    label: "ラック深さ / 最大有効深さ",
    value: `${settings.rackHeight} mm / ${settings.maxDepth} mm`,
  });

  if (settings.isStrong) {
    inputs.push({
      label: "強電エリア",
      value: `段積み数: ${settings.lStrong} 段`,
    });
    strongCables.forEach((c, i) => {
      if (!c.count || c.count <= 0) return;
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
        label: `強電ケーブル ${i + 1}`,
        value: `${name} × ${c.count}本`,
      });
    });
  }

  if (settings.isWeak) {
    inputs.push({
      label: "弱電エリア",
      value: `段積み数: ${settings.lWeak} 段`,
    });
    weakCables.forEach((c, i) => {
      if (!c.count || c.count <= 0) return;
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
        label: `弱電ケーブル ${i + 1}`,
        value: `${name} × ${c.count}本`,
      });
    });
  }

  if (settings.isStrong && settings.isWeak) {
    inputs.push({
      label: "セパレータ",
      value: `幅: ${settings.separatorWidth} mm`,
    });
  }

  let status: HistoryEntry["status"] = "success";
  if (result.isOverflow) {
    status = "error";
  } else if (!result.selectedSize) {
    status = "warning";
  }

  const results = [
    {
      label: "選定ラック幅",
      value: result.selectedSize ? `W${result.selectedSize}` : "規格外",
      isMain: true as boolean,
    },
    {
      label: "合計必要幅",
      value: `${Math.ceil(result.totalWidth)} mm`,
    },
    {
      label: "最大ケーブル高さ",
      value: `${result.maxCableStackHeight.toFixed(1)} mm`,
    },
  ];

  return {
    toolName: "ケーブルラック選定",
    status,
    mainResultText: result.selectedSize ? `W${result.selectedSize}` : "規格外",
    inputs,
    results,
  };
}
