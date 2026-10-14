/**
 * コンセント用テプラ（TEPRA）帳票 型定義
 */

export interface TepraCircuitItem {
  id?: string
  siteId?: string
  banMeisho: string
  kairoBangou: string
  kairoKigou?: string | null
  kairoMeisho?: string | null
  ukeguchiCount: number // 1以上の正の整数
}

export interface GenerateSocketTepraExcelOptions {
  circuits: TepraCircuitItem[]
  selectedBan?: string // 'ALL' または 特定の盤名称
  selectedKairoKigou?: string // 'ALL' または 特定の回路記号
  siteName?: string
}

export interface SocketTepraExcelResult {
  buffer: Uint8Array
  filename: string
  totalRows: number
  totalCircuits: number
  totalSheets: number
}
