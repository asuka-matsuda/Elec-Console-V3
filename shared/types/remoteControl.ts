/**
 * リモコン設定関連の共有型定義
 */

export interface RemoteCircuitItem {
  id: string
  siteId: string
  uniqueKey: string // "${densoKeiTo}:${fukaAddress}" または "${fukaAddress}"
  densoKeiTo: string // 伝送系統（例: "1", "2"）
  fukaAddress: string // "0-1" 〜 "63-4"
  banMeisho: string // 盤名称（一致なし: "-"）
  kairoKigou?: string | null // 回路記号（例: "丸", "二重丸", "二十楕円" など）
  kairoBangou: string // 回路番号（一致なし: "-"）
  kairoMeisho: string // 負荷名称（一致なし: "空き"）
  relayNumber?: string
  groupNumber?: string
  patternNumber?: string
  isVacant: boolean // ヒットしないアドレスは true（「空き」）
}

interface RemoteAddressAssignment {
  groups: number[]
  patterns: string[]
  relayNumber?: string
}

export interface RemoteControlConfig {
  /**
   * 各負荷アドレス（キー: "1-1", "0-2" または "1:1-1" 等）に対する割り当て
   */
  assignments: Record<string, RemoteAddressAssignment>
  /**
   * グループ備考・メモ（キー: "G1", "G2" 等）
   */
  groupRemarks?: Record<string, string>
  /**
   * パターン備考・メモ（キー: "P1 ON", "P1 OFF" 等）
   */
  patternRemarks?: Record<string, string>
}

export interface RemoteGroupSummary {
  groupNumber: number
  groupKey: string // "G1", "G2"
  addresses: string[]
  addressText: string // "1-1  1-2  6-4" (スペース2つ区切り)
  remarks?: string
}

export interface RemotePatternSummary {
  patternKey: string // "P1 ON", "P1 OFF"
  addresses: string[]
  addressText: string // "1-1  1-2"
  remarks?: string
}

export type RemoteExportTarget = 'address' | 'group' | 'pattern'

/**
 * リモコン回路台帳パース用の中間データ型
 */
export interface RawRemoteRow {
  banMeisho: string
  kairoKigou: string | null
  kairoBangou: string
  kairoMeisho: string
  relayNumber?: string
}
