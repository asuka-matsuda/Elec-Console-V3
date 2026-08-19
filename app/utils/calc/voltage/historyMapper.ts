import type { HistoryEntry } from "~/utils/calc/history/types";
import type { VoltageCalcInputs, VoltageCalcResult } from "~/utils/calc/voltage/types";
import { getVoltageFormFields } from "~/utils/config/voltageFormConfig";

import { cableData } from "~/utils/data/cableData";

/**
 * 電圧降下の計算入出力を HistoryEntry 形式に変換する
 */
export function mapVoltageToHistory(
  toolName: string,
  inputs: VoltageCalcInputs,
  result: VoltageCalcResult | null
): Omit<HistoryEntry, "id" | "timestamp"> {
  // コンフィグからラベル一覧を取得（関数化されているためダミーの関数を渡す）
  const formFields = getVoltageFormFields(
    () => true,
    () => true,
    () => []
  );

  const getLabel = (id: string) => {
    return formFields.find((f) => f.id === id)?.label || id;
  };

  const isAuto = inputs.mode === "size";
  
  // -- 1. 入力条件 (Inputs) のマッピング --
  const historyInputs: { label: string; value: string }[] = [];
  
  const sysName = inputs.sys ? inputs.sys.label : "未選択";
  historyInputs.push({ label: getLabel("phase"), value: sysName });
  
  const pfStr = inputs.pf ? inputs.pf.toString() : "1.0";
  const loadStr = `${inputs.loadVal}${inputs.loadUnit} (力率: ${pfStr})`;
  historyInputs.push({ label: getLabel("loadValue"), value: loadStr });
  
  historyInputs.push({ label: getLabel("distance"), value: `${inputs.L}m` });
  
  if (isAuto) {
    historyInputs.push({ label: getLabel("targetDrop"), value: `規定 ${inputs.targetDrop}%` });
  }
  
  historyInputs.push({ label: getLabel("parallel"), value: `${inputs.parallel}条` });
  
  const tempStr = inputs.rawTempVal && inputs.rawTempVal !== "none" ? `${inputs.ambientTemp}℃` : "なし";
  historyInputs.push({ label: getLabel("ambientTemp"), value: tempStr });
  
  historyInputs.push({ label: getLabel("derating"), value: inputs.derating.toString() });

  if (!isAuto) {
    // ケーブル指定モードの場合は使用ケーブル情報も入力条件に含める
    let cabName = `${inputs.cableType} ${inputs.selectedSize}`;
    const matched = cableData.find(
      (c: any) =>
        c.category === inputs.cableType &&
        parseFloat(String(c.size)) === inputs.selectedSize &&
        (!inputs.selectedCores || c.cores === inputs.selectedCores)
    );
    if (matched) {
      cabName = matched.name || "";
    } else {
      cabName = `${inputs.cableType} ${inputs.selectedSize}sq`;
    }
    historyInputs.push({ label: getLabel("cableType"), value: cabName });
  }

  // -- 2. 計算結果 (Results) のマッピング --
  const historyResults: { label: string; value: string; isMain?: boolean; color?: string }[] = [];
  
  let mainResultText = "エラー";
  let status: "success" | "error" | "warning" = "success";

  if (!result) {
    status = "error";
    historyResults.push({
      label: isAuto ? "選定ケーブル" : "判定",
      value: "計算エラー（条件超過）",
      isMain: true as boolean,
      color: "var(--color-status-danger)",
    });
  } else {
    // 成功・エラー判定
    const maxDropV = inputs.sys.voltage * ((inputs.targetDrop || 100) / 100);
    const isAmpOver = result.finalEffAmp > 0 && inputs.I > result.finalEffAmp;
    const isDropOver = !isAuto && result.finalDropV > maxDropV;
    const hasError = isAmpOver || isDropOver;
    
    if (hasError) status = "error";

    // メイン結果テキストの生成
    const cabType = isAuto ? result.optimal.category || "" : inputs.cableType || "";
    const size = isAuto ? result.optimal.size : inputs.selectedSize;
    let cableNameStr = `${cabType} ${size}`;
    
    const matchedCable = cableData.find(
      (c: any) =>
        c.category === cabType &&
        parseFloat(String(c.size)) === parseFloat(String(size)) &&
        (!inputs.selectedCores || c.cores === inputs.selectedCores)
    );
    if (matchedCable) {
      cableNameStr = matchedCable.name || "";
    } else {
      cableNameStr = `${cabType} ${size}sq`;
    }

    mainResultText = inputs.parallel > 1 ? `${cableNameStr} × ${inputs.parallel}条` : cableNameStr;
    
    // 詳細結果の追加
    historyResults.push({
      label: isAuto ? "選定ケーブル" : "判定",
      value: mainResultText,
      isMain: true as boolean,
      color: hasError ? "var(--color-status-danger)" : undefined,
    });

    const dropPct = ((result.finalDropV / inputs.sys.voltage) * 100).toFixed(2);
    const dropText = `${result.finalDropV.toFixed(2)}V (${dropPct}%)`;
    historyResults.push({ label: "電圧降下", value: dropText });

    historyResults.push({ label: "設計電流", value: `${inputs.I.toFixed(1)}A` });

    historyResults.push({
      label: "許容電流",
      value: result.finalEffAmp > 0 ? `${result.finalEffAmp.toFixed(1)}A` : "-",
    });
  }

  return {
    toolName,
    status,
    mainResultText,
    inputs: historyInputs,
    results: historyResults,
  };
}
