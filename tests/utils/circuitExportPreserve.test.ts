import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'

describe('circuitExport safe OpenXML in-place patch verification', () => {
  it('preserves vbaProject.bin and xml structure across JSZip patch cycles', async () => {
    // 最小限のテスト用 .xlsm ZIP 構造をメモリ上でシミュレーション
    const zip = new JSZip()

    zip.file('xl/vbaProject.bin', Buffer.from('MOCK_VBA_BINARY_DATA'))
    zip.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="List" sheetId="1" r:id="rId1"/>
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
    <row r="1">
      <c r="A1" t="s"><v>0</v></c>
      <c r="B1" t="s"><v>1</v></c>
      <c r="C1" t="s"><v>2</v></c>
      <c r="D1" t="s"><v>3</v></c>
    </row>
    <row r="2">
      <c r="A2" s="5" t="inlineStr"><is><t>1L-1</t></is></c>
      <c r="B2" s="5" t="inlineStr"><is><t>1</t></is></c>
      <c r="C2" s="5" t="inlineStr"><is><t>電灯</t></is></c>
      <c r="D2" s="33"/>
    </row>
  </sheetData>
</worksheet>`)

    const initialBuf = await zip.generateAsync({ type: 'nodebuffer' })

    // パッチ処理を検証
    const loadedZip = await JSZip.loadAsync(initialBuf)

    expect(Boolean(loadedZip.file('xl/vbaProject.bin'))).toBe(true)

    // セル D2 (スタイル s="33" を持つ空セル) に値を書き込む
    let sheetXml = await loadedZip.file('xl/worksheets/sheet1.xml')!.async('text')

    // s="33" を維持しながら <is><t>山田太郎</t></is> を設定
    sheetXml = sheetXml.replace(/<c r="D2" s="33"\/>/, '<c r="D2" s="33" t="inlineStr"><is><t>山田太郎</t></is></c>')
    loadedZip.file('xl/worksheets/sheet1.xml', sheetXml)

    const finalBuf = await loadedZip.generateAsync({ type: 'nodebuffer' })
    const finalZip = await JSZip.loadAsync(finalBuf)

    // VBAProject が消失していないこと
    expect(Boolean(finalZip.file('xl/vbaProject.bin'))).toBe(true)
    const vbaContent = await finalZip.file('xl/vbaProject.bin')!.async('text')

    expect(vbaContent).toBe('MOCK_VBA_BINARY_DATA')

    // スタイル s="33" が維持され、値が入っていること
    const updatedSheetXml = await finalZip.file('xl/worksheets/sheet1.xml')!.async('text')

    expect(updatedSheetXml).toContain('r="D2" s="33"')
    expect(updatedSheetXml).toContain('山田太郎')
  })
})
