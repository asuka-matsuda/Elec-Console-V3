import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'

import {
  getCellString,
  normalizeNewlines,
} from '../../server/utils/excel/cellFormat'
import {
  detectCircuitColumns,
  findCircuitSheet,
  makeCircuitKey,
} from '../../server/utils/excel/circuitMapping'

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

  describe('makeCircuitKey with newlines', () => {
    it('matches keys regardless of CRLF vs LF differences', () => {
      const keyFromExcel = makeCircuitKey('幹線', '1F\r\n受変電盤', '1', '動力\r\n回路A')
      const keyFromDb = makeCircuitKey('幹線', '1F\n受変電盤', '1', '動力\n回路A')

      expect(keyFromExcel).toBe(keyFromDb)
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

    it('detects confirmation date columns', () => {
      const wb = new ExcelJS.Workbook()
      const sheet = wb.addWorksheet('List')

      const headerRow = sheet.getRow(1)

      headerRow.getCell(1).value = '盤名称'
      headerRow.getCell(2).value = '回路番号'
      headerRow.getCell(3).value = '接続確認者'
      headerRow.getCell(4).value = '確認日時'
      headerRow.getCell(5).value = '絶縁抵抗測定者'
      headerRow.getCell(6).value = '絶縁測定日時'
      headerRow.getCell(7).value = '電圧測定者'
      headerRow.getCell(8).value = '電圧測定日時'

      const { colMap } = detectCircuitColumns(sheet)

      expect(colMap.p1Worker).toBe(3)
      expect(colMap.p1ConfirmedAt).toBe(4)
      expect(colMap.p2Worker).toBe(5)
      expect(colMap.p2ConfirmedAt).toBe(6)
      expect(colMap.p3Worker).toBe(7)
      expect(colMap.p3ConfirmedAt).toBe(8)
    })

    it('findCircuitSheet prioritizes List sheet over small Setting sheet', () => {
      const wb = new ExcelJS.Workbook()
      const settingSheet = wb.addWorksheet('Setting')

      for (let i = 1; i <= 38; i++) {
        settingSheet.addRow(['設定値', i])
      }

      const listSheet = wb.addWorksheet('List')

      for (let i = 1; i <= 800; i++) {
        listSheet.addRow(['回路', i])
      }

      const detected = findCircuitSheet(wb)

      expect(detected.name).toBe('List')
    })
  })
})
