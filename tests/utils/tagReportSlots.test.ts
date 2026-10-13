import path from 'node:path'

import { PrismaClient } from '@prisma/client'
import ExcelJS from 'exceljs'
import { afterAll, describe, expect, it } from 'vitest'

import { convertCircuitsToDynamicRows, generateTagReportExcel } from '../../app/utils/tagReportExcel'
import { kfc3350Template } from '../../shared/templates/tag/kfc3350'

const prisma = new PrismaClient()

describe('tagReportExcel slot detection & boundary integrity', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('correctly generates all 24 slots with exactly 5 cells each in KFC-3350 definition', () => {
    const slots = kfc3350Template.getSlots('z')

    expect(slots.length).toBe(24)

    // Verify all 24 slots have exactly 5 cells (回路番号, ケーブル, 配電方式, 系統, 回路名称)
    slots.forEach((slot, index) => {
      expect(slot.cells.length, `Slot ${index} should have 5 cells`).toBe(5)
    })
  })

  it('exports 58 circuits with deterministic KFC-3350 definition (Z-direction)', async () => {
    const tplPath = path.resolve('.data/master-templates/tpl-1791363223062-sizpc.xlsx')
    const wb = new ExcelJS.Workbook()

    await wb.xlsx.readFile(tplPath)
    const templateBuffer = await wb.xlsx.writeBuffer()

    const kansenCircuits = await prisma.circuit.findMany({
      where: { siteId: 'test', keiTo: { contains: '幹線' } },
      orderBy: { excelRow: 'asc' },
    })

    const { rows } = convertCircuitsToDynamicRows(kansenCircuits, '2026-10-08')

    // Deterministic export using templateName
    const result = await generateTagReportExcel({
      templateBuffer,
      rows,
      templateName: 'KFC-3350.xlsx',
      flowDirection: 'z',
    })
    const resultWb = new ExcelJS.Workbook()

    await resultWb.xlsx.load(result.buffer)

    // 58回路（24枠/ページ）なので3シート作成される
    expect(resultWb.worksheets.length).toBe(3)
    expect(resultWb.worksheets[0].name).toBe('Base (1)')
    expect(resultWb.worksheets[1].name).toBe('Base (2)')
    expect(resultWb.worksheets[2].name).toBe('Base (3)')

    // 各シートの印刷範囲（printArea）がそのまま100%維持されていること
    resultWb.worksheets.forEach((ws) => {
      expect(ws.pageSetup.printArea).toBe('A2:F50')
    })

    // 3ページ目（シート3: KFC-3350 Z順）
    // 58番目の回路（インデックス 57 -> 3ページ目の10枠目、Row 23, Col 2）
    const ws3 = resultWb.worksheets[2]
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
    const tplPath = path.resolve('.data/master-templates/tpl-1791363223062-sizpc.xlsx')
    const wb = new ExcelJS.Workbook()

    await wb.xlsx.readFile(tplPath)
    const ws = wb.worksheets[0]!

    // ユーザーによるフォーマット変更をシミュレート:
    // 全スロットの枠内行順を入れ替え（Row +0: 回路名称, Row +1: 系統, Row +2: 盤名称(新規キー), Row +3: 回路番号, Row +4: ケーブル）
    const startRows = [2, 9, 16, 23, 30, 37, 44, 51]
    const cols = [2, 4, 6]

    for (const r of startRows) {
      for (const c of cols) {
        ws.getCell(r, c).value = '%回路名称%'
        ws.getCell(r + 1, c).value = '%系統%'
        ws.getCell(r + 2, c).value = '%盤名称%'
        ws.getCell(r + 3, c).value = '%回路番号%'
        ws.getCell(r + 4, c).value = '%ケーブル%'
      }
    }

    const modifiedBuffer = await wb.xlsx.writeBuffer()

    const kansenCircuits = await prisma.circuit.findMany({
      where: { siteId: 'test', keiTo: { contains: '幹線' } },
      orderBy: { excelRow: 'asc' },
    })

    const { rows } = convertCircuitsToDynamicRows(kansenCircuits, '2026-10-08')

    const result = await generateTagReportExcel({
      templateBuffer: modifiedBuffer,
      rows,
      templateName: 'KFC-3350_カスタム.xlsx',
      flowDirection: 'z',
    })

    const resultWb = new ExcelJS.Workbook()

    await resultWb.xlsx.load(result.buffer)

    // 1ページ目の1スロット目（Row 2..6, Col 2）を検証
    const ws1 = resultWb.worksheets[0]!
    const row0 = rows[0]!

    // 固定セル番地ではなく、テンプレートに書かれたキーを狙って入っていること！
    expect(ws1.getCell(2, 2).value).toBe(row0.values['回路名称']) // Row 2 は %回路名称% に変更したため回路名称が入る
    expect(ws1.getCell(3, 2).value).toBe(row0.values['系統']) // Row 3 は %系統% に変更したため系統が入る
    expect(ws1.getCell(4, 2).value).toBe(row0.values['盤名称']) // Row 4 は %盤名称% を新設したため盤名称が入る
    expect(ws1.getCell(5, 2).value).toBe(row0.values['回路番号']) // Row 5 は %回路番号% に変更したため回路番号が入る
    expect(ws1.getCell(6, 2).value).toBe(row0.values['ケーブル']) // Row 6 は %ケーブル% に変更したためケーブルが入る

    // 3ページ目（シート3）の11枠目 (Row 23..27, Col 4) は余剰枠 -> プレースホルダーがすべてクリアされていること
    const ws3 = resultWb.worksheets[2]!

    expect(ws3.getCell(23, 4).value == null || ws3.getCell(23, 4).value === '').toBe(true)
    expect(ws3.getCell(24, 4).value == null || ws3.getCell(24, 4).value === '').toBe(true)
    expect(ws3.getCell(25, 4).value == null || ws3.getCell(25, 4).value === '').toBe(true)
    expect(ws3.getCell(26, 4).value == null || ws3.getCell(26, 4).value === '').toBe(true)
    expect(ws3.getCell(27, 4).value == null || ws3.getCell(27, 4).value === '').toBe(true)
  })

  it('correctly targets placeholders in real KFC-3350H 21-slot template starting at Row 14 (Col E, G, I)', async () => {
    // ユーザーの実スクリーンショットと同じレイアウトのテンプレートを作成
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('KFC-3350H')

    // 上部ヘッダー（Row 1〜13）
    ws.getCell('F1').value = 'KFC-3350'
    ws.getCell('D5').value = '普通用A4紙用（21枚分）'
    ws.getCell('D7').value = '※厚紙の場合は原寸法より小さく切ってください'

    // 縦7段（Row 14, 21, 28, 35, 42, 49, 56） × 横3列（Col 5[E], 7[G], 9[I]）
    const startRows = [14, 21, 28, 35, 42, 49, 56]
    const dataCols = [5, 7, 9] // E, G, I列
    const headerCols = [4, 6, 8] // D, F, H列（見出し）

    for (const r of startRows) {
      // 見出し列の設定
      for (const hc of headerCols) {
        ws.getCell(r + 0, hc).value = '幹線No'
        ws.getCell(r + 1, hc).value = 'ケーブル'
        ws.getCell(r + 2, hc).value = '種別'
        ws.getCell(r + 3, hc).value = '発点'
        ws.getCell(r + 4, hc).value = '着点'
        ws.getCell(r + 5, hc).value = '施工者'
        ws.getCell(r + 6, hc).value = '施工年月日'
      }

      // データ列（プレースホルダー）の設定
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

    const kansenCircuits = await prisma.circuit.findMany({
      where: { siteId: 'test', keiTo: { contains: '幹線' } },
      orderBy: { excelRow: 'asc' },
    })

    const { rows } = convertCircuitsToDynamicRows(kansenCircuits, '2026-10-08')

    const result = await generateTagReportExcel({
      templateBuffer: tplBuffer,
      rows,
      templateName: 'KFC-3350_本設用.xlsx',
      flowDirection: 'z',
    })

    const resultWb = new ExcelJS.Workbook()

    await resultWb.xlsx.load(result.buffer)

    // 58件のデータ、21枠/ページなので 3ページ生成されること
    expect(result.totalPages).toBe(3)
    expect(resultWb.worksheets.length).toBe(3)

    const ws1 = resultWb.worksheets[0]!

    // 1. 上部ヘッダー（Row 1〜13）が無傷でそのまま残っていること！
    expect(ws1.getCell('F1').value).toBe('KFC-3350')
    expect(ws1.getCell('D5').value).toBe('普通用A4紙用（21枚分）')

    // 2. 見出し列（D列: 4）が無傷でそのまま残っていること！
    expect(ws1.getCell(14, 4).value).toBe('幹線No')
    expect(ws1.getCell(15, 4).value).toBe('ケーブル')
    expect(ws1.getCell(16, 4).value).toBe('種別')
    expect(ws1.getCell(17, 4).value).toBe('発点')
    expect(ws1.getCell(18, 4).value).toBe('着点')

    // 3. 以前の誤爆箇所（Row 2, 9, 16... の B列: 2）に値が上書きされていないこと！
    expect(ws1.getCell(2, 2).value == null || ws1.getCell(2, 2).value === '').toBe(true)
    expect(ws1.getCell(9, 2).value == null || ws1.getCell(9, 2).value === '').toBe(true)

    // 4. 正しいセル（Row 14〜18, Col E: 5）に1件目のデータが正確に流し込まれていること！
    const r0 = rows[0]!

    expect(ws1.getCell(14, 5).value).toBe(r0.values['回路番号'])
    expect(ws1.getCell(15, 5).value).toBe(r0.values['ケーブル'])
    expect(ws1.getCell(16, 5).value).toBe(r0.values['配電方式'])
    expect(ws1.getCell(17, 5).value).toBe(r0.values['系統'])
    expect(ws1.getCell(18, 5).value).toBe(r0.values['回路名称'])

    // 5. 2件目のデータは Row 14〜18, Col G: 7 に入ること！
    const r1 = rows[1]!

    expect(ws1.getCell(14, 7).value).toBe(r1.values['回路番号'])
    expect(ws1.getCell(15, 7).value).toBe(r1.values['ケーブル'])

    // 6. 3ページ目の余剰枠（58件目以降）のプレースホルダーがクリアされていること！
    const ws3 = resultWb.worksheets[2]!

    // 3ページ目の16枠目（インデックス57 = 58件目）は入っている
    // 17枠目（Row 56, Col 7）は余剰枠 -> プレースホルダーが消えていること
    expect(ws3.getCell(56, 7).value == null || ws3.getCell(56, 7).value === '').toBe(true)
    expect(ws3.getCell(57, 7).value == null || ws3.getCell(57, 7).value === '').toBe(true)
  })

  it('throws explicit error when template definition is not registered', async () => {
    const tplPath = path.resolve('.data/master-templates/tpl-1791363223062-sizpc.xlsx')
    const wb = new ExcelJS.Workbook()

    await wb.xlsx.readFile(tplPath)
    const templateBuffer = await wb.xlsx.writeBuffer()

    const kansenCircuits = await prisma.circuit.findMany({
      where: { siteId: 'test', keiTo: { contains: '幹線' } },
      orderBy: { excelRow: 'asc' },
    })

    const { rows } = convertCircuitsToDynamicRows(kansenCircuits, '2026-10-08')

    // Non-matching templateName must throw without guessing
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
