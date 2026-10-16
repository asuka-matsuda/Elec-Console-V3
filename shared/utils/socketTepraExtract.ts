/**
 * コンセント用テプラ（TEPRA）Excel 抽出ユーティリティ (SSoT)
 *
 * @description 回路台帳原本Excel（データベース.xlsm）等のワークシートから
 * 見出し検索により「盤名称」「回路番号」「回路記号」「回路名称」「受口数」を検出し、
 * 受口数（1以上の正の整数）を持つコンセント回路のみを抽出します。
 */

import type { TepraCircuitItem } from '#shared/types/socketTepra'

import {
  cellValueToString,
  detectHeaderRowIndex,
  type MinimalWorksheet,
  normalizeHeaderName,
} from './excelNormalize'

const TEPRA_HEADER_TARGETS = [
  '受口数',
  '盤名称',
  '分電盤名称',
  '盤名',
  '回路番号',
  '回路no',
  '回路記号',
  '回路名称',
] as const

/**
 * ワークシートから受口数を持つテプラ対象回路一覧を抽出
 */
export function extractTepraCircuitsFromWorksheet(
  sheet: MinimalWorksheet,
  siteId: string = '',
): TepraCircuitItem[] {
  const headerRowIndex = detectHeaderRowIndex(sheet, TEPRA_HEADER_TARGETS, { exactMatch: true })
  const headerRow = sheet.getRow(headerRowIndex)

  let banMeishoCol = -1
  let kairoBangouCol = -1
  let kairoKigouCol = -1
  let kairoMeishoCol = -1
  let ukeguchiCol = -1

  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const rawText = cellValueToString(cell.value).trim()
    const norm = normalizeHeaderName(rawText)

    // 受口数は固定（エイリアス不要）
    if (rawText === '受口数' && ukeguchiCol === -1) {
      ukeguchiCol = colNumber
    }
    else if (/盤名称|分電盤名称|盤名/.test(norm) && banMeishoCol === -1) {
      banMeishoCol = colNumber
    }
    else if (/回路番号|回路no/.test(norm) && kairoBangouCol === -1) {
      kairoBangouCol = colNumber
    }
    else if (/回路記号/.test(norm) && kairoKigouCol === -1) {
      kairoKigouCol = colNumber
    }
    else if (/回路名称|回路名|負荷名称|負荷名/.test(norm) && kairoMeishoCol === -1) {
      kairoMeishoCol = colNumber
    }
  })

  // 「受口数」列が存在しない場合は対象データなし
  if (ukeguchiCol === -1 || banMeishoCol === -1 || kairoBangouCol === -1) {
    return []
  }

  const circuits: TepraCircuitItem[] = []
  const dataStartRow = headerRowIndex + 1

  if (sheet.eachRow) {
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber < dataStartRow) return

      // 受口数の数値判定（変な値は取得せず正の整数のみ許可）
      const ukeguchiRaw = row.getCell(ukeguchiCol).value
      let ukeguchiCount = 0

      if (typeof ukeguchiRaw === 'number' && Number.isInteger(ukeguchiRaw) && ukeguchiRaw > 0) {
        ukeguchiCount = ukeguchiRaw
      }
      else if (typeof ukeguchiRaw === 'string') {
        const trimmed = ukeguchiRaw.trim()

        if (/^\d+$/.test(trimmed)) {
          const parsed = parseInt(trimmed, 10)

          if (parsed > 0) {
            ukeguchiCount = parsed
          }
        }
      }

      // 受口数がない、0以下、または変な値（文字など）はスキップ
      if (ukeguchiCount <= 0) return

      const banMeisho = cellValueToString(row.getCell(banMeishoCol).value).trim()
      const kairoBangou = cellValueToString(row.getCell(kairoBangouCol).value).trim()

      if (!banMeisho || !kairoBangou) return

      const kairoKigou = kairoKigouCol !== -1
        ? cellValueToString(row.getCell(kairoKigouCol).value).trim() || null
        : null

      const kairoMeisho = kairoMeishoCol !== -1
        ? cellValueToString(row.getCell(kairoMeishoCol).value).trim() || null
        : null

      circuits.push({
        id: `${banMeisho}_${kairoBangou}_row${rowNumber}`,
        siteId,
        banMeisho,
        kairoBangou,
        kairoKigou,
        kairoMeisho,
        ukeguchiCount,
      })
    })
  }

  return circuits
}
