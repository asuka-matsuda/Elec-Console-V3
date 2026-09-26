/**
 * Excel 回路台帳列マッピング・ヘッダー検知ユーティリティ
 *
 * Excelシートのヘッダー自動検知、標準列名マッピングおよび回路複合キー生成を提供します。
 */

import type ExcelJS from 'exceljs'

import { normalizeNewlines } from './cellFormat'

export interface CircuitColumnMap {
  banMeisho: number
  banShubetsu: number
  haidenHoushiki: number
  souShubetsu: number
  shadankiShubetsu: number
  shadankiYouryou: number
  kairoKigou: number
  kairoBangou: number
  kairoMeisho: number
  cableList: number
  haisenJousuu: number
  setsuchiUmu: number
  setsuchiList: number
  keiTo: number
  p1Worker: number
  p1Remarks: number
  zetsuenR: number
  zetsuenS: number
  zetsuenT: number
  p2Worker: number
  p2Remarks: number
  denatsuRs: number
  denatsuSt: number
  denatsuRt: number
  kensou: number
  p3Worker: number
  p3Remarks: number
}

export const DEFAULT_CIRCUIT_COLUMN_MAP: CircuitColumnMap = {
  banMeisho: 5,
  banShubetsu: 6,
  haidenHoushiki: 7,
  souShubetsu: 9,
  shadankiShubetsu: 10,
  shadankiYouryou: 11,
  kairoKigou: 12,
  kairoBangou: 13,
  kairoMeisho: 14,
  cableList: 15,
  haisenJousuu: 16,
  setsuchiUmu: 17,
  setsuchiList: 18,
  keiTo: 22,
  p1Worker: 24,
  p1Remarks: 25,
  zetsuenR: 26,
  zetsuenS: 27,
  zetsuenT: 28,
  p2Worker: 29,
  p2Remarks: 30,
  denatsuRs: 31,
  denatsuSt: 32,
  denatsuRt: 33,
  kensou: 34,
  p3Worker: 35,
  p3Remarks: 36,
}

const STANDARD_HEADER_NAMES: Record<keyof CircuitColumnMap, string> = {
  banMeisho: '盤名称',
  banShubetsu: '盤種別',
  haidenHoushiki: '配電方式',
  souShubetsu: '相種別',
  shadankiShubetsu: '遮断器種別',
  shadankiYouryou: '遮断器容量',
  kairoKigou: '回路記号',
  kairoBangou: '回路番号',
  kairoMeisho: '回路名称',
  cableList: 'ケーブル',
  haisenJousuu: '配線条数',
  setsuchiUmu: '接地有無',
  setsuchiList: '接地種別',
  keiTo: '幹線/二次側',
  p1Worker: 'P1確認者',
  p1Remarks: 'P1備考',
  zetsuenR: 'P2(R)',
  zetsuenS: 'P2(S)',
  zetsuenT: 'P2(T)',
  p2Worker: 'P2測定者',
  p2Remarks: 'P2備考',
  denatsuRs: 'P3(RS)',
  denatsuSt: 'P3(ST)',
  denatsuRt: 'P3(RT)',
  kensou: '検相',
  p3Worker: 'P3測定者',
  p3Remarks: 'P3備考',
}

/**
 * ワークシートのヘッダー行から見出し文字を直接取得し、列番号マップを構築する
 */
export function detectCircuitColumns(sheet: ExcelJS.Worksheet): {
  colMap: CircuitColumnMap
  headerMap: Map<string, number>
  headerRowNumber: number
  dataStartRowNumber: number
} {
  let bestHeaderRow = 4
  let maxMatches = 0
  let bestHeaderMap = new Map<string, number>()

  const scanLimit = Math.min(sheet.rowCount || 10, 10)
  const standardNames = new Set(Object.values(STANDARD_HEADER_NAMES))

  for (let r = 1; r <= scanLimit; r++) {
    const row = sheet.getRow(r)
    const currentMap = new Map<string, number>()
    let matchCount = 0

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const name = cell.value != null ? String(cell.value).trim() : ''

      if (!name) return

      currentMap.set(name, colNumber)

      if (standardNames.has(name)) {
        matchCount++
      }
    })

    if (matchCount > maxMatches) {
      maxMatches = matchCount
      bestHeaderRow = r
      bestHeaderMap = currentMap
    }
  }

  // 見出し名から直接列番号を決定（未検知項目はデフォルト列番号でフォールバック）
  const colMap: CircuitColumnMap = { ...DEFAULT_CIRCUIT_COLUMN_MAP }

  for (const [key, headerName] of Object.entries(STANDARD_HEADER_NAMES) as [keyof CircuitColumnMap, string][]) {
    const colNumber = bestHeaderMap.get(headerName)

    if (colNumber !== undefined) {
      colMap[key] = colNumber
    }
  }

  return {
    colMap,
    headerMap: bestHeaderMap,
    headerRowNumber: bestHeaderRow,
    dataStartRowNumber: bestHeaderRow + 1,
  }
}

/**
 * 回路を一意に識別するための複合キーを生成
 */
export function makeCircuitKey(
  keiTo: string,
  banMeisho: string,
  kairoBangou: string | null | undefined,
  kairoMeisho: string | null | undefined,
): string {
  const norm = (s: string | null | undefined) => normalizeNewlines(s || '')

  return `${norm(keiTo)}::${norm(banMeisho)}::${norm(kairoBangou)}::${norm(kairoMeisho)}`
}
