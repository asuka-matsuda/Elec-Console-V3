import type { Circuit } from '@prisma/client'
import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'

import {
  applyCircuitToRow,
  detectCircuitColumns,
  getCellString,
  makeCircuitKey,
  normalizeNewlines,
  setCellStringWithNewlines,
} from '../../server/utils/circuitExcel'

describe('circuitExcel newline preservation', () => {
  describe('normalizeNewlines', () => {
    it('normalizes CRLF and CR to LF while preserving internal newlines', () => {
      expect(normalizeNewlines('Line 1\r\nLine 2\r\nLine 3')).toBe('Line 1\nLine 2\nLine 3')
      expect(normalizeNewlines('Line 1\rLine 2')).toBe('Line 1\nLine 2')
      expect(normalizeNewlines('  \r\nLine 1\nLine 2  \r\n  ')).toBe('Line 1\nLine 2')
      expect(normalizeNewlines('')).toBe('')
    })
  })

  describe('getCellString with newlines', () => {
    it('extracts multiline text from plain cell values preserving newlines', () => {
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Test')
      const row = sheet.getRow(1)

      row.getCell(1).value = '1F 事務室\r\nコンセント回路\r\n(予備)'
      const extracted = getCellString(row, 1)

      expect(extracted).toBe('1F 事務室\nコンセント回路\n(予備)')
    })

    it('extracts multiline text from richText cell values preserving newlines', () => {
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Test')
      const row = sheet.getRow(1)

      row.getCell(1).value = {
        richText: [
          { text: '盤名称A\r\n' },
          { text: '2F 電灯' },
        ],
      }
      const extracted = getCellString(row, 1)

      expect(extracted).toBe('盤名称A\n2F 電灯')
    })
  })

  describe('setCellStringWithNewlines', () => {
    it('sets CRLF and enables wrapText for multiline text', () => {
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Test')
      const row = sheet.getRow(1)
      const cell = row.getCell(1)

      setCellStringWithNewlines(cell, '備考1行目\n備考2行目')

      expect(cell.value).toBe('備考1行目\r\n備考2行目')
      expect(cell.alignment?.wrapText).toBe(true)
    })

    it('does not enable wrapText if there is no newline', () => {
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Test')
      const row = sheet.getRow(1)
      const cell = row.getCell(1)

      setCellStringWithNewlines(cell, '1行のみの備考')

      expect(cell.value).toBe('1行のみの備考')
      expect(cell.alignment?.wrapText).toBeUndefined()
    })
  })

  describe('makeCircuitKey with newlines', () => {
    it('matches keys regardless of CRLF vs LF differences', () => {
      const keyFromExcel = makeCircuitKey('幹線', '1F\r\n受変電盤', '1', '動力\r\n回路A')
      const keyFromDb = makeCircuitKey('幹線', '1F\n受変電盤', '1', '動力\n回路A')

      expect(keyFromExcel).toBe(keyFromDb)
    })
  })

  describe('applyCircuitToRow preserves newlines in Excel output', () => {
    it('writes multiline remarks with wrapText enabled', () => {
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Test')
      const row = sheet.getRow(5)

      const mockCircuit: Partial<Circuit> = {
        id: 'test-1',
        siteId: 'site-1',
        keiTo: '二次側',
        banMeisho: 'L-1',
        kairoBangou: '1',
        kairoMeisho: '照明回路\n(LED)',
        p1ConfirmedAt: new Date(),
        p1Kakunin: true,
        p1Mashishime: true,
        p1Worker: '佐藤\n技術員',
        p1Remarks: '増し締め完了\n端子台緩みなし',
        p2ConfirmedAt: new Date(),
        p2Worker: '鈴木',
        p2Remarks: '測定値正常\n絶縁良好',
        p3ConfirmedAt: new Date(),
        p3Worker: '高橋',
        p3Remarks: '電圧確認済\n相回転OK',
      }

      applyCircuitToRow(row, mockCircuit as Circuit)

      // P1確認者 (Col 24)
      expect(row.getCell(24).value).toBe('佐藤\r\n技術員')
      expect(row.getCell(24).alignment?.wrapText).toBe(true)

      // P1備考 (Col 25)
      expect(row.getCell(25).value).toBe('増し締め完了\r\n端子台緩みなし')
      expect(row.getCell(25).alignment?.wrapText).toBe(true)

      // P2備考 (Col 30)
      expect(row.getCell(30).value).toBe('測定値正常\r\n絶縁良好')
      expect(row.getCell(30).alignment?.wrapText).toBe(true)

      // P3備考 (Col 36)
      expect(row.getCell(36).value).toBe('電圧確認済\r\n相回転OK')
      expect(row.getCell(36).alignment?.wrapText).toBe(true)
    })
  })

  describe('Roundtrip Excel buffer test', () => {
    it('preserves multiline text through writing to buffer and reading back', async () => {
      const wbOut = new ExcelJS.Workbook()
      const sheetOut = wbOut.addWorksheet('回路ﾘｽﾄ')
      const rowOut = sheetOut.getRow(5)

      setCellStringWithNewlines(rowOut.getCell(14), '回路名称\n2行目\n3行目')
      setCellStringWithNewlines(rowOut.getCell(25), 'P1備考\n改行あり')

      const buf = await wbOut.xlsx.writeBuffer()

      // 読み戻し
      const wbIn = new ExcelJS.Workbook()

      await wbIn.xlsx.load(buf as ExcelJS.Buffer)
      const sheetIn = wbIn.getWorksheet('回路ﾘｽﾄ')!
      const rowIn = sheetIn.getRow(5)

      expect(getCellString(rowIn, 14)).toBe('回路名称\n2行目\n3行目')
      expect(getCellString(rowIn, 25)).toBe('P1備考\n改行あり')
    })
  })

  describe('Dynamic header-based column mapping (Protection of custom/inserted columns)', () => {
    it('detects shifted columns when extra custom columns are inserted', () => {
      const wb = new ExcelJS.Workbook()
      const sheet = wb.addWorksheet('回路ﾘｽﾄ')

      // 行3に見出し（途中に「バッテリー」と「受口数」が挿入されたケース）
      const headerRow = sheet.getRow(3)

      headerRow.getCell(2).value = '盤名称'
      headerRow.getCell(3).value = '回路番号'
      headerRow.getCell(4).value = 'バッテリーチェック' // 独自列1
      headerRow.getCell(5).value = '受口数' // 独自列2
      headerRow.getCell(6).value = '回路名称'
      headerRow.getCell(7).value = 'P2(R)'
      headerRow.getCell(8).value = 'P3(RS)'

      const { colMap, headerRowNumber, dataStartRowNumber } = detectCircuitColumns(sheet)

      expect(headerRowNumber).toBe(3)
      expect(dataStartRowNumber).toBe(4)
      expect(colMap.banMeisho).toBe(2)
      expect(colMap.kairoBangou).toBe(3)
      expect(colMap.kairoMeisho).toBe(6)
      expect(colMap.zetsuenR).toBe(7)
      expect(colMap.denatsuRs).toBe(8)
    })

    it('protects inserted custom columns from being overwritten during applyCircuitToRow', () => {
      const wb = new ExcelJS.Workbook()
      const sheet = wb.addWorksheet('回路ﾘｽﾄ')

      const headerRow = sheet.getRow(1)

      headerRow.getCell(1).value = '盤名称'
      headerRow.getCell(2).value = '回路番号'
      headerRow.getCell(3).value = 'バッテリーチェック'
      headerRow.getCell(4).value = '受口数'
      headerRow.getCell(5).value = 'P2(R)'

      const { colMap } = detectCircuitColumns(sheet)
      const dataRow = sheet.getRow(2)

      // 元の設計データ
      dataRow.getCell(1).value = '1L-1'
      dataRow.getCell(2).value = '1'
      dataRow.getCell(3).value = '合格(内蔵電池OK)'
      dataRow.getCell(4).value = '3口'
      dataRow.getCell(5).value = ''

      const mockCircuit: Partial<Circuit> = {
        id: 'test-2',
        siteId: 'site-1',
        keiTo: '二次側',
        banMeisho: '1L-1',
        kairoBangou: '1',
        p2ConfirmedAt: new Date(),
        p2RStatus: '良好',
        p2IsComplete: true,
      }

      applyCircuitToRow(dataRow, mockCircuit as Circuit, colMap)

      // 独自列（バッテリー・受口数）が100%保護されていること
      expect(dataRow.getCell(3).value).toBe('合格(内蔵電池OK)')
      expect(dataRow.getCell(4).value).toBe('3口')

      // 試験結果（P2 R相）が正しく Col 5 に書き込まれていること
      expect(dataRow.getCell(5).value).toBe(100)
    })
  })
})
