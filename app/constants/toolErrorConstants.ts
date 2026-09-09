/**
 * ツールのエラー・警告・選定不可メッセージの共通定義
 */
export interface ToolErrorInfo {
  id: string
  title: string
  message: string
  suggestion?: string
}

export const TOOL_ERRORS: Record<string, ToolErrorInfo> = {
  // 電圧降下・ケーブルサイズ選定ツール
  VOLTAGE_SIZE_OVER: {
    id: 'VOLTAGE_SIZE_OVER',
    title: '選定不可（規格上限超過）',
    message: '目標電圧降下率を満たすケーブルサイズが対象種別の規格上限を超過。',
    suggestion: 'ケーブル種別をCV等に変更するか、敷設条数の増加を推奨。',
  },
  VOLTAGE_AMP_OVER: {
    id: 'VOLTAGE_AMP_OVER',
    title: '許容電流不足',
    message: '設計電流がケーブルの許容電流（低減係数適用後）を超過。',
    suggestion: 'より太いケーブルサイズへの変更、または敷設条数の増加を推奨。',
  },
  VOLTAGE_NO_MATCHING_CABLE: {
    id: 'VOLTAGE_NO_MATCHING_CABLE',
    title: '該当規格なし',
    message: '指定された配電方式（心数等）に該当するケーブルが非存在。',
    suggestion: '配電方式またはケーブル種別の見直しを推奨。',
  },

  // ケーブルラック選定ツール
  RACK_SIZE_OVER: {
    id: 'RACK_SIZE_OVER',
    title: 'ラック規格外',
    message: '必要幅が最大規格幅（1200mm）を超過。',
    suggestion: '2段敷設への変更、またはラック系統の分割を推奨。',
  },
  RACK_OVERFLOW: {
    id: 'RACK_OVERFLOW',
    title: 'ラック高さ不足',
    message: '積載ケーブル外径がラック有効内寸高さを超過。',
    suggestion: 'ラック高さの変更、または平置き（1段）への変更を推奨。',
  },
  RACK_TIER2_NOT_APPLICABLE: {
    id: 'RACK_TIER2_NOT_APPLICABLE',
    title: '段積み不可',
    message: 'ケーブルが1本のみのため2段敷設不可。',
    suggestion: '1段敷設（平置き）の選択を推奨。',
  },

  // 配管選定ツール
  CONDUIT_OVERSIZE: {
    id: 'CONDUIT_OVERSIZE',
    title: '配管規格外',
    message: '許容占積率を満たす配管サイズが規格上限を超過。',
    suggestion: '配管系統の分割、またはケーブルサイズの見直しを推奨。',
  },
} as const

export type ToolErrorId = keyof typeof TOOL_ERRORS | (string & {})

/**
 * エラーIDからエラー情報を取得する関数
 */
export function getToolError(id: ToolErrorId | undefined | null): ToolErrorInfo | undefined {
  if (!id) return undefined

  return TOOL_ERRORS[id]
}
