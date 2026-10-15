/**
 * コンセント用テプラ（TEPRA）Excel 帳票生成エンジン
 *
 * @description 盤名称・回路記号で絞り込まれた回路一覧から、
 * 受口数（1以上の正の整数）を持つコンセント回路を抽出し、
 * 盤名称ごとにワークシートを分割して受口数の数だけ転記（行複製）した
 * テプラ流し込み用Excel (.xlsx) を生成します。
 *
 * 仕様:
 * - テンプレートファイル不要（コードで完全自動生成）
 * - シート名: 盤名称（盤ごとにシート分割）
 * - 1行目: A1「盤名称」、B1「回路番号」
 * - 2行目: 空行
 * - 3行目〜: 受口数分だけ複製したデータ行
 */

import type ExcelJS from 'exceljs'

import type {
  GenerateSocketTepraExcelOptions,
  SocketTepraExcelResult,
  TepraCircuitItem,
} from '#shared/types/socketTepra'
import { sanitizeFilename, sanitizeSheetName } from '#shared/utils/filename'
import { getExcelJS } from '~/utils/excelHelper'

export { sanitizeSheetName }

/**
 * テプラ用Excel帳票を生成
 */
export async function generateSocketTepraExcel(
  options: GenerateSocketTepraExcelOptions,
): Promise<SocketTepraExcelResult> {
  const {
    circuits,
    selectedBan = 'ALL',
    selectedKairoKigou = 'ALL',
    siteName = '現場',
  } = options

  // 1. 絞り込み（盤名称・回路記号・受口数 > 0）
  const targetCircuits = circuits.filter((c) => {
    // 盤名称フィルター
    if (selectedBan !== 'ALL' && c.banMeisho !== selectedBan) {
      return false
    }

    // 回路記号フィルター
    if (selectedKairoKigou !== 'ALL') {
      const kigou = c.kairoKigou?.trim() || ''

      if (kigou !== selectedKairoKigou) {
        return false
      }
    }

    // 受口数が正の整数であること
    return typeof c.ukeguchiCount === 'number' && c.ukeguchiCount > 0
  })

  if (targetCircuits.length === 0) {
    throw new Error('出力対象の受口数（コンセント）回路がありません')
  }

  // 2. 盤名称ごとにグループ化
  const banGroups = new Map<string, TepraCircuitItem[]>()

  for (const c of targetCircuits) {
    const ban = c.banMeisho || '未分類'

    if (!banGroups.has(ban)) {
      banGroups.set(ban, [])
    }
    banGroups.get(ban)!.push(c)
  }

  const ExcelJS = await getExcelJS()
  const workbook = new ExcelJS.Workbook()

  workbook.creator = 'Elec-Console'

  let totalRows = 0
  const usedSheetNames = new Set<string>()

  // 3. 各盤ごとにシートを作成しデータを流し込み
  for (const [banName, banCircuits] of banGroups.entries()) {
    // シート名のサニタイズ＆重複回避
    let baseSheetName = sanitizeSheetName(banName)

    if (usedSheetNames.has(baseSheetName)) {
      let counter = 2
      let uniqueName = `${baseSheetName.slice(0, 28)}_${counter}`

      while (usedSheetNames.has(uniqueName)) {
        counter++
        uniqueName = `${baseSheetName.slice(0, 27)}_${counter}`
      }
      baseSheetName = uniqueName
    }
    usedSheetNames.add(baseSheetName)

    const sheet = workbook.addWorksheet(baseSheetName, {
      views: [{ showGridLines: true }],
    })

    // 列幅の設定
    sheet.getColumn(1).width = 18 // A列: 盤名称
    sheet.getColumn(2).width = 18 // B列: 回路番号

    // 1行目: 見出し
    const headerRow = sheet.getRow(1)
    const cellA1 = headerRow.getCell(1)
    const cellB1 = headerRow.getCell(2)

    cellA1.value = '盤名称'
    cellB1.value = '回路番号'

    // 見出しスタイル（太字・中央揃え）
    const headerFont: Partial<ExcelJS.Font> = {
      name: 'Meiryo UI',
      bold: true,
      size: 11,
    }
    const headerAlignment: Partial<ExcelJS.Alignment> = {
      vertical: 'middle',
      horizontal: 'center',
    }

    cellA1.font = headerFont
    cellA1.alignment = headerAlignment
    cellB1.font = headerFont
    cellB1.alignment = headerAlignment
    headerRow.height = 24

    // 2行目: 仕様に基づき空行（空けておく）
    const blankRow = sheet.getRow(2)

    blankRow.height = 18

    // 3行目〜: 受口数分だけ複製してデータを出力
    let currentRowNumber = 3

    for (const c of banCircuits) {
      const count = c.ukeguchiCount

      for (let i = 0; i < count; i++) {
        const dataRow = sheet.getRow(currentRowNumber)

        const cellA = dataRow.getCell(1)
        const cellB = dataRow.getCell(2)

        cellA.value = c.banMeisho
        cellB.value = c.kairoBangou

        // データ行スタイル（中央揃え・明瞭なフォント）
        const dataFont: Partial<ExcelJS.Font> = {
          name: 'Meiryo UI',
          size: 11,
        }
        const dataAlignment: Partial<ExcelJS.Alignment> = {
          vertical: 'middle',
          horizontal: 'center',
        }

        cellA.font = dataFont
        cellA.alignment = dataAlignment
        cellB.font = dataFont
        cellB.alignment = dataAlignment
        dataRow.height = 20

        currentRowNumber++
        totalRows++
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const safeSiteName = sanitizeFilename(siteName, '現場')
  const filename = `${safeSiteName}_テプラ印刷_${totalRows}枚.xlsx`

  return {
    buffer: new Uint8Array(buffer),
    filename,
    totalRows,
    totalCircuits: targetCircuits.length,
    totalSheets: banGroups.size,
  }
}
