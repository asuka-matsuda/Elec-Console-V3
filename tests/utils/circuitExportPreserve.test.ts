import fs from 'node:fs'
import path from 'node:path'

import JSZip from 'jszip'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { generateCircuitsExcelBuffer } from '../../server/utils/excel/circuitExport'
import { prisma } from '../../server/utils/prisma'

describe('circuitExport safe OpenXML in-place patch verification (generateCircuitsExcelBuffer 実関数検証)', () => {
  const testSiteId = `TEST_EXPORT_PRESERVE_${Date.now()}`
  const templateDir = path.resolve(process.cwd(), '.data', 'templates', testSiteId)
  const templateFilePath = path.join(templateDir, 'master.xlsm')

  beforeEach(async () => {
    fs.mkdirSync(templateDir, { recursive: true })

    // 最小限のテスト用 .xlsm ZIP 構造を生成してファイル保存
    const zip = new JSZip()

    zip.file('xl/vbaProject.bin', Buffer.from('MOCK_VBA_BINARY_DATA'))
    zip.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="回路一覧" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`)
    zip.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`)
    zip.file('xl/sharedStrings.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="4" uniqueCount="4">
  <si><t>盤名称</t></si>
  <si><t>回路番号</t></si>
  <si><t>回路名称</t></si>
  <si><t>接続確認者</t></si>
</sst>`)
    zip.file('xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="5">
      <c r="E5" t="s"><v>0</v></c>
      <c r="M5" t="s"><v>1</v></c>
      <c r="N5" t="s"><v>2</v></c>
      <c r="X5" t="s"><v>3</v></c>
    </row>
    <row r="6">
      <c r="E6" s="5" t="inlineStr"><is><t>1L-1</t></is></c>
      <c r="M6" s="5" t="inlineStr"><is><t>1</t></is></c>
      <c r="N6" s="5" t="inlineStr"><is><t>電灯回路A</t></is></c>
      <c r="X6" s="33"/>
    </row>
  </sheetData>
</worksheet>`)

    const buf = await zip.generateAsync({ type: 'nodebuffer' })

    fs.writeFileSync(templateFilePath, buf)

    await prisma.site.create({
      data: {
        id: testSiteId,
        name: 'エクスポート保護検証現場',
        settings: {
          create: {
            excelPath: path.join('.data', 'templates', testSiteId, 'master.xlsm'),
          },
        },
      },
    })

    await prisma.circuit.create({
      data: {
        siteId: testSiteId,
        excelRow: 6,
        keiTo: '二次側',
        banShubetsu: '電灯',
        banMeisho: '1L-1',
        kairoBangou: '1',
        kairoMeisho: '電灯回路A',
        p1Kakunin: true,
        p1Mashishime: true,
        p1Worker: '山田太郎',
        p1ConfirmedAt: new Date('2026-10-15T01:30:00.000Z'),
        p1Remarks: '現地確認済',
      },
    })
  })

  afterEach(async () => {
    await prisma.circuit.deleteMany({ where: { siteId: testSiteId } })
    await prisma.siteSettings.deleteMany({ where: { siteId: testSiteId } })
    await prisma.site.deleteMany({ where: { id: testSiteId } })
    if (fs.existsSync(templateDir)) {
      fs.rmSync(templateDir, { recursive: true, force: true })
    }
  })

  it('generateCircuitsExcelBuffer が実関数で vbaProject.bin とセルスタイル s="33" を保持したまま試験結果を書き戻すこと', async () => {
    const result = await generateCircuitsExcelBuffer(testSiteId)

    expect(result.isXlsm).toBe(true)
    expect(result.count).toBe(1)

    const finalZip = await JSZip.loadAsync(result.buffer)

    // VBAProject が消失していないこと
    expect(Boolean(finalZip.file('xl/vbaProject.bin'))).toBe(true)
    const vbaContent = await finalZip.file('xl/vbaProject.bin')!.async('text')

    expect(vbaContent).toBe('MOCK_VBA_BINARY_DATA')

    // スタイル s="33" が維持され、確認者「山田太郎」が書き戻されていること
    const updatedSheetXml = await finalZip.file('xl/worksheets/sheet1.xml')!.async('text')

    expect(updatedSheetXml).toContain('r="X6"')
    expect(updatedSheetXml).toContain('s="33"')
    expect(updatedSheetXml).toContain('山田太郎')
  })
})
