/**
 * サーバー側 テプラ用回路抽出エンジン
 *
 * @description 現場設定の原本Excel（データベース.xlsm）から見出し検索を行い、
 * 受口数（1以上の正の整数）を持つコンセント回路一覧（TepraCircuitItem[]）を抽出します。
 */

import fs from 'node:fs'

import ExcelJS from 'exceljs'

import type { TepraCircuitItem } from '#shared/types/socketTepra'
import { findPreferredWorksheet } from '#shared/utils/excelNormalize'
import { extractTepraCircuitsFromWorksheet } from '#shared/utils/socketTepraExtract'

import { resolveExistingExcelPath } from './safePath'

/**
 * 原本Excelバッファから受口数を持つテプラ回路一覧を抽出
 */
export async function extractTepraCircuitsFromExcelBuffer(
  buffer: Buffer | Uint8Array,
  siteId: string = '',
): Promise<TepraCircuitItem[]> {
  const workbook = new ExcelJS.Workbook()

  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer)

  const sheet = findPreferredWorksheet(workbook)

  if (!sheet) return []

  return extractTepraCircuitsFromWorksheet(sheet, siteId)
}

/**
 * 現場のテプラ用回路一覧を取得する（原本Excel「データベース.xlsm」から抽出）
 */
export async function loadSiteTepraCircuits(
  siteId: string,
  rawExcelPath?: string | null,
): Promise<TepraCircuitItem[]> {
  if (rawExcelPath) {
    try {
      const safePath = resolveExistingExcelPath(rawExcelPath)

      if (fs.existsSync(safePath)) {
        const buffer = await fs.promises.readFile(safePath)
        const extracted = await extractTepraCircuitsFromExcelBuffer(buffer, siteId)

        if (extracted.length > 0) {
          return extracted
        }
      }
    }
    catch (e) {
      console.warn('[SocketTepra] Failed to extract from Excel:', e)
    }
  }

  return []
}
