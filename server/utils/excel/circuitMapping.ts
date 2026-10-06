/**
 * Excel 回路台帳列マッピング・ヘッダー検知ユーティリティ
 *
 * Excelシートのヘッダー自動検知、標準列名マッピングおよび回路複合キー生成を提供します。
 */

import type ExcelJS from 'exceljs'

import { normalizeHeaderName } from '#shared/utils/excelNormalize'

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
  setsuchiManual?: number
  setsuchiC?: number
  setsuchiD?: number
  setsuchiDelb?: number
  keiTo: number
  p1Worker?: number
  p1ConfirmedAt?: number
  p1Remarks?: number
  zetsuenR?: number
  zetsuenS?: number
  zetsuenT?: number
  p2Worker?: number
  p2ConfirmedAt?: number
  p2Remarks?: number
  denatsuRs?: number
  denatsuSt?: number
  denatsuRt?: number
  kensou?: number
  p3Worker?: number
  p3ConfirmedAt?: number
  p3Remarks?: number
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
  setsuchiManual: undefined,
  setsuchiC: undefined,
  setsuchiD: undefined,
  setsuchiDelb: undefined,
  keiTo: 22,
  p1Worker: 24,
  p1ConfirmedAt: undefined,
  p1Remarks: 25,
  zetsuenR: 26,
  zetsuenS: 27,
  zetsuenT: 28,
  p2Worker: 29,
  p2ConfirmedAt: undefined,
  p2Remarks: 30,
  denatsuRs: 31,
  denatsuSt: 32,
  denatsuRt: 33,
  kensou: 34,
  p3Worker: 35,
  p3ConfirmedAt: undefined,
  p3Remarks: 36,
}

/**
 * 各項目に対する認識見出し候補（エイリアス）リスト
 */
const HEADER_ALIASES: Record<keyof CircuitColumnMap, string[]> = {
  // 基本設計情報（読取用）
  banMeisho: ['盤名称', '分電盤名称', '盤名'],
  banShubetsu: ['盤種別', '種別'],
  haidenHoushiki: ['配電方式'],
  souShubetsu: ['相種別'],
  shadankiShubetsu: ['遮断器種別'],
  shadankiYouryou: ['遮断器容量', '遮断器サイズ', '配電盤遮断器容量'],
  kairoKigou: ['回路記号'],
  kairoBangou: ['回路番号', '回路No', '回路No.'],
  kairoMeisho: ['回路名称', '回路名', '負荷名称'],
  cableList: ['ケーブル', 'ケーブルリスト', '電線'],
  haisenJousuu: ['配線条数'],
  setsuchiUmu: ['接地有無'],
  setsuchiList: ['接地リスト', '接地種別', '接地'],
  setsuchiManual: ['接地（手動）', '接地(手動)', '接地手動', '手動接地'],
  setsuchiC: ['接地C種', '接地c種', 'C種接地'],
  setsuchiD: ['接地D種', '接地d種', 'D種接地'],
  setsuchiDelb: ['接地D（ELB）種', '接地D(ELB)種', '接地d(elb)種', '接地delb種', '接地D・ELB種', 'D(ELB)種接地'],
  keiTo: ['幹線判定', '幹線/二次側', '系統', '区分'],

  // Phase 1 (書き戻し対象)
  p1Worker: ['接続確認者', 'P1確認者', '確認者', 'P1作業者'],
  p1ConfirmedAt: ['確認日時', '接続確認日時', 'P1確認日時', 'P1日時', 'P1測定日時'],
  p1Remarks: ['備考1', 'P1備考', '接続備考'],

  // Phase 2 (書き戻し対象)
  zetsuenR: ['絶縁抵抗R', 'P2(R)', 'P2R', 'R相絶縁'],
  zetsuenS: ['絶縁抵抗S', 'P2(S)', 'P2S', 'S相絶縁'],
  zetsuenT: ['絶縁抵抗T', 'P2(T)', 'P2T', 'T相絶縁'],
  p2Worker: ['絶縁抵抗測定者', 'P2測定者', '絶縁測定者', 'P2作業者'],
  p2ConfirmedAt: ['絶縁測定日時', '絶縁抵抗測定日時', 'P2測定日時', 'P2日時'],
  p2Remarks: ['備考2', 'P2備考', '絶縁備考'],

  // Phase 3 (書き戻し対象)
  denatsuRs: ['電圧RS', 'P3(RS)', 'P3RS', 'RS電圧'],
  denatsuSt: ['電圧ST', 'P3(ST)', 'P3ST', 'ST電圧'],
  denatsuRt: ['電圧RT', 'P3(RT)', 'P3RT', 'RT電圧'],
  kensou: ['確認', '検相', 'P3確認', '検相確認'],
  p3Worker: ['電圧測定者', 'P3測定者', 'P3作業者'],
  p3ConfirmedAt: ['電圧測定日時', 'P3測定日時', 'P3日時'],
  p3Remarks: ['備考3', 'P3備考', '電圧備考'],
}

/**
 * ワークシートのヘッダー行から見出し文字を動的走査し、列番号マップを構築する
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

  // 全エイリアスの正規化セットを構築
  const allAliases = new Set<string>()

  for (const list of Object.values(HEADER_ALIASES)) {
    for (const a of list) {
      allAliases.add(normalizeHeaderName(a))
    }
  }

  for (let r = 1; r <= scanLimit; r++) {
    const row = sheet.getRow(r)
    const currentMap = new Map<string, number>()
    let matchCount = 0

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const norm = normalizeHeaderName(cell.value)

      if (!norm) return

      currentMap.set(norm, colNumber)

      if (allAliases.has(norm)) {
        matchCount++
      }
    })

    if (matchCount > maxMatches) {
      maxMatches = matchCount
      bestHeaderRow = r
      bestHeaderMap = currentMap
    }
  }

  // 見出し名エイリアスから直接列番号を決定
  const colMap: CircuitColumnMap = { ...DEFAULT_CIRCUIT_COLUMN_MAP }

  for (const [key, aliases] of Object.entries(HEADER_ALIASES) as [keyof CircuitColumnMap, string[]][]) {
    let foundCol: number | undefined

    for (const alias of aliases) {
      const col = bestHeaderMap.get(normalizeHeaderName(alias))

      if (col !== undefined) {
        foundCol = col
        break
      }
    }

    if (foundCol !== undefined) {
      colMap[key] = foundCol
    }
    else if (
      key === 'setsuchiManual'
      || key === 'setsuchiC'
      || key === 'setsuchiD'
      || key === 'setsuchiDelb'
      || key === 'p1Worker'
      || key === 'p1ConfirmedAt'
      || key === 'p1Remarks'
      || key === 'zetsuenR'
      || key === 'zetsuenS'
      || key === 'zetsuenT'
      || key === 'p2Worker'
      || key === 'p2ConfirmedAt'
      || key === 'p2Remarks'
      || key === 'denatsuRs'
      || key === 'denatsuSt'
      || key === 'denatsuRt'
      || key === 'kensou'
      || key === 'p3Worker'
      || key === 'p3ConfirmedAt'
      || key === 'p3Remarks'
    ) {
      // 任意項目・書き戻し対象項目は見出しが見つからない場合は undefined とする
      colMap[key] = undefined
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
 * ワークブックから回路リストが記載されたシートを特定する
 */
export function findCircuitSheet(workbook: ExcelJS.Workbook): ExcelJS.Worksheet {
  const PREFERRED_NAMES = ['list', '回路リスト', '回路一覧', '台帳', 'circuits']

  // 1. シート名による優先マッチング
  for (const preferred of PREFERRED_NAMES) {
    const found = workbook.worksheets.find((ws) => {
      const norm = normalizeHeaderName(ws.name)

      return norm === preferred || norm.includes(preferred)
    })

    if (found) return found
  }

  // 2. 最もヘッダー項目が合致するシートを探索
  let bestSheet: ExcelJS.Worksheet | null = null
  let maxHeaderCount = 0

  for (const ws of workbook.worksheets) {
    const { headerMap } = detectCircuitColumns(ws)

    if (headerMap.size > maxHeaderCount) {
      maxHeaderCount = headerMap.size
      bestSheet = ws
    }
  }

  if (bestSheet && maxHeaderCount >= 3) {
    return bestSheet
  }

  // 3. データ行数が最も多いシート（Setting等の小型設定シートを避ける）
  let longestSheet: ExcelJS.Worksheet | null = null
  let maxRows = 0

  for (const ws of workbook.worksheets) {
    if (ws.rowCount > maxRows) {
      maxRows = ws.rowCount
      longestSheet = ws
    }
  }

  const target = longestSheet || workbook.worksheets[0]

  if (!target) {
    throw new Error('ワークブックにシートが見つかりません')
  }

  return target
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
