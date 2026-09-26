/**
 * Excel 回路台帳エクスポート・結果書き戻しエンジン
 *
 * Web上で入力・測定された最新試験結果（Phase 1〜3）および基本情報を
 * 元のExcel台帳ファイルまたはバイナリバッファへ正確に書き戻します。
 */

import fs from 'node:fs'

import type { Circuit } from '@prisma/client'
import ExcelJS from 'exceljs'

import { prisma } from '../prisma'
import { getCellString, isKansen, setCellStringWithNewlines } from './cellFormat'
import {
  type CircuitColumnMap,
  DEFAULT_CIRCUIT_COLUMN_MAP,
  detectCircuitColumns,
  makeCircuitKey,
} from './circuitMapping'
import { validateSafeExcelPath } from './safePath'

interface ExportCircuitResult {
  success: boolean
  count: number
  filePath: string
  error?: string
}

/**
 * 回路データの各フェーズ試験結果を行セルへ書き戻す
 */
export function applyCircuitToRow(
  row: ExcelJS.Row,
  c: Circuit,
  colMap: CircuitColumnMap = DEFAULT_CIRCUIT_COLUMN_MAP,
) {
  // Phase 1 書戻し
  if (c.p1ConfirmedAt && c.p1Kakunin && c.p1Mashishime) {
    setCellStringWithNewlines(row.getCell(colMap.p1Worker), c.p1Worker || '確認済')
  }
  if (c.p1Remarks) {
    setCellStringWithNewlines(row.getCell(colMap.p1Remarks), c.p1Remarks)
  }

  // Phase 2 書戻し
  if (c.p2ConfirmedAt || c.p2IsComplete) {
    // R相
    if (c.p2RStatus === '良好') {
      row.getCell(colMap.zetsuenR).value = c.keiTo === '幹線' ? 500 : 100
    }
    else if (c.zetsuenR !== null && c.zetsuenR !== undefined) {
      row.getCell(colMap.zetsuenR).value = c.zetsuenR
    }

    // S相
    if (c.p2SStatus === '良好') {
      row.getCell(colMap.zetsuenS).value = c.keiTo === '幹線' ? 500 : 100
    }
    else if (c.zetsuenS !== null && c.zetsuenS !== undefined) {
      row.getCell(colMap.zetsuenS).value = c.zetsuenS
    }

    // T相
    if (c.p2TStatus === '良好') {
      row.getCell(colMap.zetsuenT).value = c.keiTo === '幹線' ? 500 : 100
    }
    else if (c.zetsuenT !== null && c.zetsuenT !== undefined) {
      row.getCell(colMap.zetsuenT).value = c.zetsuenT
    }

    if (c.p2Worker) {
      setCellStringWithNewlines(row.getCell(colMap.p2Worker), c.p2Worker)
    }
    if (c.p2Remarks) {
      setCellStringWithNewlines(row.getCell(colMap.p2Remarks), c.p2Remarks)
    }
  }

  // Phase 3 書戻し
  if (c.p3ConfirmedAt) {
    if (c.denatsuRs !== null && c.denatsuRs !== undefined) {
      row.getCell(colMap.denatsuRs).value = c.denatsuRs
    }
    if (c.denatsuSt !== null && c.denatsuSt !== undefined) {
      row.getCell(colMap.denatsuSt).value = c.denatsuSt
    }
    if (c.denatsuRt !== null && c.denatsuRt !== undefined) {
      row.getCell(colMap.denatsuRt).value = c.denatsuRt
    }
    if (c.kensou) {
      setCellStringWithNewlines(row.getCell(colMap.kensou), c.kensou)
    }
    if (c.p3Worker) {
      setCellStringWithNewlines(row.getCell(colMap.p3Worker), c.p3Worker)
    }
    if (c.p3Remarks) {
      setCellStringWithNewlines(row.getCell(colMap.p3Remarks), c.p3Remarks)
    }
  }

  // Web側で編集された基本情報（回路番号・回路名称・ケーブル等）がある場合の書戻し
  if (c.p1ModifiedFields && c.p1ModifiedFields !== '[]') {
    if (c.kairoBangou) setCellStringWithNewlines(row.getCell(colMap.kairoBangou), c.kairoBangou)
    if (c.kairoMeisho) setCellStringWithNewlines(row.getCell(colMap.kairoMeisho), c.kairoMeisho)
    if (c.cableList) setCellStringWithNewlines(row.getCell(colMap.cableList), c.cableList)
    if (c.haisenJousuu) setCellStringWithNewlines(row.getCell(colMap.haisenJousuu), c.haisenJousuu)
    if (c.setsuchiList) setCellStringWithNewlines(row.getCell(colMap.setsuchiList), c.setsuchiList)
  }
}

/**
 * 回路データおよび最新試験結果を含むExcelファイルのバイナリバッファを生成する
 */
export async function generateCircuitsExcelBuffer(
  siteId: string,
  baseFilePath?: string | null,
): Promise<{ buffer: Buffer, count: number }> {
  const circuits = await prisma.circuit.findMany({
    where: { siteId },
    orderBy: [
      { excelRow: 'asc' },
      { createdAt: 'asc' },
    ],
  })

  const workbook = new ExcelJS.Workbook()
  const cleanPath = baseFilePath && typeof baseFilePath === 'string' && baseFilePath.trim()
    ? validateSafeExcelPath(baseFilePath)
    : ''
  const hasBaseFile = cleanPath && fs.existsSync(cleanPath)

  if (!hasBaseFile) {
    throw new Error('現場設定にExcelファイルが登録されていないか、ファイルが見つかりません')
  }

  await workbook.xlsx.readFile(cleanPath)
  const sheet = workbook.getWorksheet('回路ﾘｽﾄ') || workbook.worksheets[0]

  if (!sheet) {
    throw new Error('ワークブックにシートが見つかりません')
  }

  const { colMap, dataStartRowNumber } = detectCircuitColumns(sheet)

  const circuitByKey = new Map<string, Circuit[]>()

  for (const c of circuits) {
    const key = makeCircuitKey(c.keiTo, c.banMeisho, c.kairoBangou, c.kairoMeisho)
    const list = circuitByKey.get(key) || []

    list.push(c)
    circuitByKey.set(key, list)
  }

  let updatedCount = 0

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber < dataStartRowNumber) return

    const banMeisho = getCellString(row, colMap.banMeisho)
    const kairoMeisho = getCellString(row, colMap.kairoMeisho)
    const kairoBangou = getCellString(row, colMap.kairoBangou)
    const kansenRaw = row.getCell(colMap.keiTo).value
    const keiTo = isKansen(kansenRaw)

    if (!banMeisho && !kairoMeisho && !kairoBangou) return

    const key = makeCircuitKey(keiTo, banMeisho, kairoBangou, kairoMeisho)
    const candidates = circuitByKey.get(key)
    const c = candidates && candidates.length > 0 ? candidates.shift()! : null

    if (c) {
      applyCircuitToRow(row, c, colMap)
      updatedCount++
    }
  })

  const uint8 = await workbook.xlsx.writeBuffer()

  return {
    buffer: Buffer.from(uint8),
    count: updatedCount,
  }
}

/**
 * Web上の最新試験結果をExcelファイルに書き戻す（エクスポート）
 */
export async function exportCircuitsToExcel(
  siteId: string,
  rawFilePath: string,
  workerName: string = 'システム管理者',
): Promise<ExportCircuitResult> {
  const filePath = validateSafeExcelPath(rawFilePath)

  if (!fs.existsSync(filePath)) {
    throw new Error(`Excelファイルが見つかりません: ${filePath}`)
  }

  const { buffer, count } = await generateCircuitsExcelBuffer(siteId, filePath)

  await fs.promises.writeFile(filePath, buffer)

  await prisma.operationLog.create({
    data: {
      siteId,
      worker: workerName,
      action: 'Excel書戻し',
      targetBan: '全体',
      targetKairo: '一括書戻し',
      details: `Excel(${filePath})へ${count}件の最新試験結果を書き戻しました`,
    },
  })

  return {
    success: true,
    count,
    filePath,
  }
}
