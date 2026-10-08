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
})
