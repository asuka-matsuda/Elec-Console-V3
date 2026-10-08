/**
 * ExcelJS クライアント側遅延ローダー
 * 初期バンドルサイズ削減のため、Excel生成・パース実行時にのみ動的インポートします。
 */
import type ExcelJS from 'exceljs'

let cachedExcelJS: typeof ExcelJS | null = null

export async function getExcelJS(): Promise<typeof ExcelJS> {
  if (!cachedExcelJS) {
    const mod = await import('exceljs')

    cachedExcelJS = (mod.default || mod) as unknown as typeof ExcelJS
  }

  return cachedExcelJS
}
