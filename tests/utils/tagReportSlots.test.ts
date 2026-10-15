import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'

import { convertCircuitsToDynamicRows, generateTagReportExcel } from '../../app/utils/tagReportExcel'
import { kfc3350Template } from '../../shared/templates/tag/kfc3350'

/**
 * 外部ファイルや実行時DB状態に依存しない自己完結型の 58 件幹線回路フィクスチャを生成
 */
function buildKansenCircuitsFixture(count = 58) {
  return Array.from({ length: count }, (_, idx) => {
    const isLast = idx === count - 1

    return {
      id: `circuit-kansen-${idx + 1}`,
      siteId: 'fixture-site',
      excelRow: idx + 1,
      keiTo: '幹線',
      keiToName: isLast ? '一般･保安動力盤' : `電灯幹線系統-${idx + 1}`,
      banShubetsu: isLast ? '動力' : '電灯',
      banMeisho: isLast ? 'MP-58' : `1L-${idx + 1}`,
      haidenHoushiki: isLast ? 'AC-GC 3Φ3W 200V' : 'AC 1Φ3W 100/200V',
      souShubetsu: 'RST',
      kairoKigou: null,
      kairoBangou: isLast ? 'HP-105' : `L-${idx + 1}`,
      kairoMeisho: isLast ? 'OP-1(2)' : `分電盤幹線-${idx + 1}`,
      cableList: isLast ? 'CVT 150sq' : 'CVT 38sq',
      setsuchiList: 'IV 14sq',
    }
  })
}

/**
 * KFC-3350 標準24枠テンプレートのインメモリ Excel バッファを生成
 */
async function buildKfc3350StandardTemplateBuffer(customizeOrder = false): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Base')

  ws.pageSetup.printArea = 'A2:F50'

  const startRows = [2, 9, 16, 23, 30, 37, 44, 51]
  const cols = [2, 4, 6]

  for (const r of startRows) {
    for (const c of cols) {
      if (customizeOrder) {
        ws.getCell(r, c).value = '%回路名称%'
        ws.getCell(r + 1, c).value = '%系統%'
        ws.getCell(r + 2, c).value = '%盤名称%'
        ws.getCell(r + 3, c).value = '%回路番号%'
        ws.getCell(r + 4, c).value = '%ケーブル%'
      }
      else {
        ws.getCell(r, c).value = '%回路番号%'
        ws.getCell(r + 1, c).value = '%ケーブル%'
        ws.getCell(r + 2, c).value = '%配電方式%'
        ws.getCell(r + 3, c).value = '%系統%'
        ws.getCell(r + 4, c).value = '%回路名称%'
      }
    }
  }

  return wb.xlsx.writeBuffer()
}

describe('tagReportExcel slot detection & boundary integrity', () => {
  it('correctly generates all 24 slots with exactly 5 cells each in KFC-3350 definition', () => {
    const slots = kfc3350Template.getSlots('z')

    expect(slots.length).toBe(24)

    slots.forEach((slot, index) => {
      expect(slot.cells.length, `Slot ${index} should have 5 cells`).toBe(5)
    })
  })

  it('exports 58 circuits with deterministic KFC-3350 definition (Z-direction)', async () => {
    const templateBuffer = await buildKfc3350StandardTemplateBuffer(false)
    const kansenCircuits = buildKansenCircuitsFixture(58)
    const { rows } = convertCircuitsToDynamicRows(kansenCircuits, '2026-10-08')

    const result = await generateTagReportExcel({
      templateBuffer,
      rows,
      templateName: 'KFC-3350.xlsx',
      flowDirection: 'z',
    })
    const resultWb = new ExcelJS.Workbook()

    await resultWb.xlsx.load(result.buffer as unknown as ExcelJS.Buffer)

    // 58回路（24枠/ページ）なので3シート作成される
    expect(resultWb.worksheets.length).toBe(3)
    expect(resultWb.worksheets[0]?.name).toBe('Base (1)')
    expect(resultWb.worksheets[1]?.name).toBe('Base (2)')
    expect(resultWb.worksheets[2]?.name).toBe('Base (3)')

    // 各シートの印刷範囲（printArea）がそのまま100%維持されていること
    resultWb.worksheets.forEach((ws) => {
      expect(ws.pageSetup.printArea).toBe('A2:F50')
    })

    // 3ページ目（シート3: KFC-3350 Z順）
    // 58番目の回路（インデックス 57 -> 3ページ目の10枠目、Row 23, Col 2）
    const ws3 = resultWb.worksheets[2]!
    const cCircuitNo = ws3.getCell(23, 2).value
    const cCable = ws3.getCell(24, 2).value
    const cVolt = ws3.getCell(25, 2).value
    const cKeito = ws3.getCell(26, 2).value
    const cName = ws3.getCell(27, 2).value

    expect(cCircuitNo).toContain('HP-105')
    expect(cCable).toContain('CVT 150sq')
    expect(cVolt).toContain('AC-GC 3Φ3W')
    expect(cKeito).toContain('一般･保安動力盤')
    expect(cName).toContain('OP-1(2)')

    // 3ページ目 11枠目 (Row 23, Col 4) は余剰枠 -> プレースホルダーがクリアされていること
    const emptyCircuitNo = ws3.getCell(23, 4).value
    const emptyCable = ws3.getCell(24, 4).value

    expect(emptyCircuitNo == null || emptyCircuitNo === '').toBe(true)
    expect(emptyCable == null || emptyCable === '').toBe(true)
  })

  it('dynamically targets placeholders even when row order is customized and new keys are added', async () => {
    const modifiedBuffer = await buildKfc3350StandardTemplateBuffer(true)
    const kansenCircuits = buildKansenCircuitsFixture(58)
    const { rows } = convertCircuitsToDynamicRows(kansenCircuits, '2026-10-08')

    const result = await generateTagReportExcel({
      templateBuffer: modifiedBuffer,
      rows,
      templateName: 'KFC-3350_カスタム.xlsx',
      flowDirection: 'z',
    })

    const resultWb = new ExcelJS.Workbook()

    await resultWb.xlsx.load(result.buffer as unknown as ExcelJS.Buffer)

    // 1ページ目の1スロット目（Row 2..6, Col 2）を検証
    const ws1 = resultWb.worksheets[0]!
    const row0 = rows[0]!

    expect(ws1.getCell(2, 2).value).toBe(row0.values['回路名称'])
    expect(ws1.getCell(3, 2).value).toBe(row0.values['系統'])
    expect(ws1.getCell(4, 2).value).toBe(row0.values['盤名称'])
    expect(ws1.getCell(5, 2).value).toBe(row0.values['回路番号'])
    expect(ws1.getCell(6, 2).value).toBe(row0.values['ケーブル'])

    // 3ページ目（シート3）の11枠目 (Row 23..27, Col 4) は余剰枠 -> プレースホルダーがすべてクリアされていること
    const ws3 = resultWb.worksheets[2]!

    expect(ws3.getCell(23, 4).value == null || ws3.getCell(23, 4).value === '').toBe(true)
    expect(ws3.getCell(24, 4).value == null || ws3.getCell(24, 4).value === '').toBe(true)
    expect(ws3.getCell(25, 4).value == null || ws3.getCell(25, 4).value === '').toBe(true)
    expect(ws3.getCell(26, 4).value == null || ws3.getCell(26, 4).value === '').toBe(true)
    expect(ws3.getCell(27, 4).value == null || ws3.getCell(27, 4).value === '').toBe(true)
  })

  it('correctly targets placeholders in real KFC-3350H 21-slot template starting at Row 14 (Col E, G, I)', async () => {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('KFC-3350H')

    // 上部ヘッダー（Row 1〜13）
    ws.getCell('F1').value = 'KFC-3350'
    ws.getCell('D5').value = '普通用A4紙用（21枚分）'
    ws.getCell('D7').value = '※厚紙の場合は原寸法より小さく切ってください'

    // 縦7段（Row 14, 21, 28, 35, 42, 49, 56） × 横3列（Col 5[E], 7[G], 9[I]）
    const startRows = [14, 21, 28, 35, 42, 49, 56]
    const dataCols = [5, 7, 9]
    const headerCols = [4, 6, 8]

    for (const r of startRows) {
      for (const hc of headerCols) {
        ws.getCell(r + 0, hc).value = '幹線No'
        ws.getCell(r + 1, hc).value = 'ケーブル'
        ws.getCell(r + 2, hc).value = '種別'
        ws.getCell(r + 3, hc).value = '発点'
        ws.getCell(r + 4, hc).value = '着点'
        ws.getCell(r + 5, hc).value = '施工者'
        ws.getCell(r + 6, hc).value = '施工年月日'
      }

      for (const dc of dataCols) {
        ws.getCell(r + 0, dc).value = '%回路番号%'
        ws.getCell(r + 1, dc).value = '%ケーブル%'
        ws.getCell(r + 2, dc).value = '%配電方式%'
        ws.getCell(r + 3, dc).value = '%系統%'
        ws.getCell(r + 4, dc).value = '%回路名称%'
        ws.getCell(r + 5, dc).value = ''
        ws.getCell(r + 6, dc).value = '2026年10月'
      }
    }

    const tplBuffer = await wb.xlsx.writeBuffer()
    const kansenCircuits = buildKansenCircuitsFixture(58)
    const { rows } = convertCircuitsToDynamicRows(kansenCircuits, '2026-10-08')

    const result = await generateTagReportExcel({
      templateBuffer: tplBuffer,
      rows,
      templateName: 'KFC-3350_本設用.xlsx',
      flowDirection: 'z',
    })

    const resultWb = new ExcelJS.Workbook()

    await resultWb.xlsx.load(result.buffer as unknown as ExcelJS.Buffer)

    expect(result.totalPages).toBe(3)
    expect(resultWb.worksheets.length).toBe(3)

    const ws1 = resultWb.worksheets[0]!

    expect(ws1.getCell('F1').value).toBe('KFC-3350')
    expect(ws1.getCell('D5').value).toBe('普通用A4紙用（21枚分）')

    expect(ws1.getCell(14, 4).value).toBe('幹線No')
    expect(ws1.getCell(15, 4).value).toBe('ケーブル')
    expect(ws1.getCell(16, 4).value).toBe('種別')
    expect(ws1.getCell(17, 4).value).toBe('発点')
    expect(ws1.getCell(18, 4).value).toBe('着点')

    expect(ws1.getCell(2, 2).value == null || ws1.getCell(2, 2).value === '').toBe(true)
    expect(ws1.getCell(9, 2).value == null || ws1.getCell(9, 2).value === '').toBe(true)

    const r0 = rows[0]!

    expect(ws1.getCell(14, 5).value).toBe(r0.values['回路番号'])
    expect(ws1.getCell(15, 5).value).toBe(r0.values['ケーブル'])
    expect(ws1.getCell(16, 5).value).toBe(r0.values['配電方式'])
    expect(ws1.getCell(17, 5).value).toBe(r0.values['系統'])
    expect(ws1.getCell(18, 5).value).toBe(r0.values['回路名称'])

    const r1 = rows[1]!

    expect(ws1.getCell(14, 7).value).toBe(r1.values['回路番号'])
    expect(ws1.getCell(15, 7).value).toBe(r1.values['ケーブル'])

    const ws3 = resultWb.worksheets[2]!

    expect(ws3.getCell(56, 7).value == null || ws3.getCell(56, 7).value === '').toBe(true)
    expect(ws3.getCell(57, 7).value == null || ws3.getCell(57, 7).value === '').toBe(true)
  })

  it('throws explicit error when template definition is not registered', async () => {
    const templateBuffer = await buildKfc3350StandardTemplateBuffer(false)
    const kansenCircuits = buildKansenCircuitsFixture(5)
    const { rows } = convertCircuitsToDynamicRows(kansenCircuits, '2026-10-08')

    await expect(
      generateTagReportExcel({
        templateBuffer,
        rows,
        templateName: 'unknown-custom-tag-template.xlsx',
      }),
    ).rejects.toThrow('確定ロジックファイル（TS）が登録されていません')
  })

  it('clusterConsecutiveNumbers properly clusters numbers based on gap', async () => {
    const { clusterConsecutiveNumbers } = await import('../../shared/utils/tagSlotDetector')

    expect(clusterConsecutiveNumbers([])).toEqual([])
    expect(clusterConsecutiveNumbers([5])).toEqual([[5]])
    expect(clusterConsecutiveNumbers([2, 3, 4, 9, 10, 16, 17, 18])).toEqual([
      [2, 3, 4],
      [9, 10],
      [16, 17, 18],
    ])
    expect(clusterConsecutiveNumbers([1, 3, 5], 1)).toEqual([[1], [3], [5]])
    expect(clusterConsecutiveNumbers([1, 3, 5], 2)).toEqual([[1, 3, 5]])
  })
})
