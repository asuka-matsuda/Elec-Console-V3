import { describe, expect, it } from 'vitest'
import ExcelJS from 'exceljs'
import { extractExcludedKeywordsFromWorkbook } from '../../server/utils/excel/circuitImport'

describe('extractExcludedKeywordsFromWorkbook', () => {
  it('returns empty array when Setting sheet does not exist', () => {
    const wb = new ExcelJS.Workbook()
    wb.addWorksheet('Sheet1')
    expect(extractExcludedKeywordsFromWorkbook(wb)).toEqual([])
  })

  it('extracts keywords from Setting sheet with table named 除外ﾘｽﾄ', () => {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Setting')

    // J5:J8 にヘッダーとデータ
    ws.getCell('J5').value = '除外キーワード'
    ws.getCell('J6').value = '予備'
    ws.getCell('J7').value = '制御電源'
    ws.getCell('J8').value = '別途'

    // テーブル模擬
    const wsAny = ws as unknown as { tables: Record<string, unknown> }
    wsAny.tables = {
      除外ﾘｽﾄ: {
        name: '除外ﾘｽﾄ',
        tableRef: 'J5:J8',
      },
    }

    const result = extractExcludedKeywordsFromWorkbook(wb)
    expect(result).toEqual(['予備', '制御電源', '別途'])
  })

  it('extracts keywords from fallback cell scanning when table is missing', () => {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Setting')

    ws.getCell('B3').value = '除外キーワード'
    ws.getCell('B4').value = '気化式加湿器'
    ws.getCell('B5').value = '空冷外気処理ｴｱｺﾝ'
    ws.getCell('B6').value = '' // 空白でストップ

    const result = extractExcludedKeywordsFromWorkbook(wb)
    expect(result).toEqual(['気化式加湿器', '空冷外気処理ｴｱｺﾝ'])
  })

  it('supports full-width table name 除外リスト as well', () => {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Setting')

    ws.getCell('A1').value = '除外キーワード'
    ws.getCell('A2').value = '自動倉庫1-1'
    ws.getCell('A3').value = '自動倉庫1-2'

    const wsAny = ws as unknown as { tables: Record<string, unknown> }
    wsAny.tables = {
      除外リスト: {
        name: '除外リスト',
        tableRef: 'A1:A3',
      },
    }

    const result = extractExcludedKeywordsFromWorkbook(wb)
    expect(result).toEqual(['自動倉庫1-1', '自動倉庫1-2'])
  })
})
