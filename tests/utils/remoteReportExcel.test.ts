import ExcelJS from 'exceljs'
import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'

import type { RemoteCircuitItem, RemoteControlConfig } from '#shared/types/remoteControl'

import {
  buildGroupSummaries,
  buildPatternSummaries,
  extractRemoteCircuitsFromExcel,
  generateRemoteReportExcel,
} from '../../app/utils/remoteReportExcel'

describe('remoteReportExcel', () => {
  it('buildGroupSummaries: グループごとのアドレス一覧を正しく集計・スペース区切り結合できること', () => {
    const config: RemoteControlConfig = {
      assignments: {
        '1-1': { groups: [1, 2], patterns: [] },
        '1-2': { groups: [1], patterns: [] },
        '2-1': { groups: [1], patterns: [] },
        '6-4': { groups: [2], patterns: [] },
      },
    }

    const summaries = buildGroupSummaries(config, 5)

    expect(summaries).toHaveLength(5)

    const g1 = summaries.find(s => s.groupKey === 'G1')!

    expect(g1.addresses).toEqual(['1-1', '1-2', '2-1'])
    expect(g1.addressText).toBe('1-1  1-2  2-1')

    const g2 = summaries.find(s => s.groupKey === 'G2')!

    expect(g2.addresses).toEqual(['1-1', '6-4'])
    expect(g2.addressText).toBe('1-1  6-4')

    const g3 = summaries.find(s => s.groupKey === 'G3')!

    expect(g3.addresses).toEqual([])
    expect(g3.addressText).toBe('')
  })

  it('buildPatternSummaries: パターンごとのアドレス一覧を正しく集計・スペース区切り結合できること', () => {
    const config: RemoteControlConfig = {
      assignments: {
        '1-1': { groups: [], patterns: ['P1 ON', 'P2 OFF'] },
        '1-2': { groups: [], patterns: ['P1 ON'] },
      },
    }

    const summaries = buildPatternSummaries(config, 3)
    const p1On = summaries.find(s => s.patternKey === 'P1 ON')!

    expect(p1On.addresses).toEqual(['1-1', '1-2'])
    expect(p1On.addressText).toBe('1-1  1-2')

    const p2Off = summaries.find(s => s.patternKey === 'P2 OFF')!

    expect(p2Off.addresses).toEqual(['1-1'])
  })

  it('extractRemoteCircuitsFromExcel: 伝送系統ごとに0-1〜63-4(全256スロット)を生成し、一致・空きを判定できること', async () => {
    const wb = new ExcelJS.Workbook()
    const sheet = wb.addWorksheet('回路台帳')

    sheet.getRow(1).values = ['伝送系統', '盤名称', '回路記号', '回路番号', '回路名称', '負荷ｱﾄﾞﾚｽ', 'ﾘﾚｰ番号']
    sheet.getRow(2).values = ['1', '1L-1', '丸', '1-R1', '電灯照明A', '1-1', 'R1']
    sheet.getRow(3).values = ['1', '1L-1', '', '2', '予備回路', '-', '']
    sheet.getRow(4).values = ['1', '1L-2', '二重丸', '2-R2', '荷役室照明', '2-1', 'R2']

    const buffer = await wb.xlsx.writeBuffer()
    const circuits = await extractRemoteCircuitsFromExcel(new Uint8Array(buffer))

    // 0-1 〜 63-4 の256スロットが生成されること
    expect(circuits).toHaveLength(256)

    const c11 = circuits.find(c => c.fukaAddress === '1-1')!

    expect(c11.isVacant).toBe(false)
    expect(c11.banMeisho).toBe('1L-1')
    expect(c11.kairoKigou).toBe('丸')
    expect(c11.kairoBangou).toBe('1-R1')
    expect(c11.kairoMeisho).toBe('電灯照明A')
    expect(c11.relayNumber).toBe('R1')

    const c21 = circuits.find(c => c.fukaAddress === '2-1')!

    expect(c21.isVacant).toBe(false)
    expect(c21.banMeisho).toBe('1L-2')
    expect(c21.kairoKigou).toBe('二重丸')

    const c01 = circuits.find(c => c.fukaAddress === '0-1')!

    expect(c01.isVacant).toBe(true)
    expect(c01.kairoMeisho).toBe('空き')
    expect(c01.banMeisho).toBe('-')
    expect(c01.kairoBangou).toBe('-')
  })

  it('generateRemoteReportExcel: テンプレートなしで新規ワークブックを生成し、アドレス設定表シートが正しく含まれること', async () => {
    const dummyCircuits: RemoteCircuitItem[] = [
      { id: '1', siteId: 's1', uniqueKey: '1:0-1', densoKeiTo: '1', banMeisho: '-', kairoBangou: '-', kairoMeisho: '空き', fukaAddress: '0-1', isVacant: true },
      { id: '2', siteId: 's1', uniqueKey: '1:1-1', densoKeiTo: '1', banMeisho: '1L-1', kairoBangou: '1-R1', kairoMeisho: '事務所照明', fukaAddress: '1-1', isVacant: false },
    ]

    const config: RemoteControlConfig = {
      assignments: {
        '1-1': { groups: [1, 2], patterns: ['P1 ON'] },
      },
    }

    const result = await generateRemoteReportExcel({
      circuits: dummyCircuits,
      config,
      siteName: 'テスト現場',
    })

    const wb = new ExcelJS.Workbook()

    await wb.xlsx.load(result.buffer as unknown as Parameters<typeof wb.xlsx.load>[0])

    expect(wb.worksheets.map(s => s.name)).toEqual(['アドレス設定表'])
    expect(result.filename).toBe('テスト現場_リモコン設定表.xlsx')

    const adrSheet = wb.getWorksheet('アドレス設定表')!

    expect(adrSheet.rowCount).toBeGreaterThanOrEqual(6)
  })

  it('generateRemoteReportExcel: アドレス設定表シートで改行置換・T/U余り・完全空きスロット・回路記号配置が正しく動作すること', async () => {
    const templateWb = new ExcelJS.Workbook()
    const adrSheet = templateWb.addWorksheet('アドレス設定表')

    // 4行目: ヘッダー
    adrSheet.getRow(4).values = ['アドレス番号', '', '盤名称', '回路番号', 'リレー番号', '負荷名称']
    // 5行目: 通常回路 (0-1)
    adrSheet.getRow(5).values = ['0-1', '', '%盤名称%', '%回路番号%', '%リレー番号%', '%回路名称%']
    // 6行目: T/U余り (0-2: 盤名あり・回路なし)
    adrSheet.getRow(6).values = ['0-2', '', '%盤名称%', '%回路番号%', '%リレー番号%', '%回路名称%']
    // 7行目: 完全空きスロット (0-3: 回路なし・盤名なし)
    adrSheet.getRow(7).values = ['0-3', '', '%盤名称%', '%回路番号%', '%リレー番号%', '%回路名称%']

    const templateBuffer = await templateWb.xlsx.writeBuffer()

    const dummyCircuits: RemoteCircuitItem[] = [
      {
        id: '1',
        siteId: 's1',
        banMeisho: '1L-1',
        kairoBangou: '1',
        kairoKigou: '丸',
        kairoMeisho: '事務室\n照明\n(200V)',
        fukaAddress: '0-1',
        relayNumber: 'R1',
        isVacant: false,
      },
      {
        id: '2',
        siteId: 's1',
        banMeisho: '1L-1',
        kairoBangou: '',
        kairoMeisho: '',
        fukaAddress: '0-2',
        isVacant: true,
      },
    ]

    const config: RemoteControlConfig = {
      assignments: {
        '0-1': { groups: [1], patterns: [] },
      },
    }

    const result = await generateRemoteReportExcel({
      templateBuffer,
      circuits: dummyCircuits,
      config,
      siteName: 'テスト現場',
      symbolOptions: {
        enabled: true,
        width: 41,
        height: 24,
      },
    })

    const outWb = new ExcelJS.Workbook()

    await outWb.xlsx.load(result.buffer as unknown as ExcelJS.Buffer)
    const outSheet = outWb.getWorksheet('アドレス設定表')!

    expect(outSheet).toBeDefined()

    // 5行目: 通常回路
    expect(outSheet.getCell('C5').value).toBe('1L-1')
    expect(outSheet.getCell('D5').value).toBe('1')
    expect(outSheet.getCell('E5').value).toBe('R1')
    // 回路名称の改行が半角スペースに置換されていること (回答1)
    expect(outSheet.getCell('F5').value).toBe('事務室 照明 (200V)')

    // 6行目: T/U余り (回答3: 盤名あり・回路なしは「-」)
    expect(outSheet.getCell('C6').value).toBe('1L-1')
    expect(outSheet.getCell('D6').value).toBe('-')
    expect(outSheet.getCell('E6').value).toBe('-')
    expect(outSheet.getCell('F6').value).toBe('-')

    // 7行目: 完全空きスロット (回答3: 回路なし・盤名なしは空白)
    expect(outSheet.getCell('C7').value ?? '').toBe('')
    expect(outSheet.getCell('D7').value ?? '').toBe('')
    expect(outSheet.getCell('E7').value ?? '').toBe('')
    expect(outSheet.getCell('F7').value ?? '').toBe('')
  })

  it('generateRemoteReportExcel: Direct Template Engine による 100% 完全保護（印刷範囲・改ページ・原本図形・スタイル）をインメモリテンプレートで検証', async () => {
    const templateZip = new JSZip()

    templateZip.file('xl/styles.xml', '<styleSheet><numFmts count="1"/><fonts count="1"/><cellXfs count="1"/></styleSheet>')
    templateZip.file('xl/workbook.xml', '<workbook><sheets><sheet name="アドレス設定表" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm.Print_Area" localSheetId="0">\'アドレス設定表\'!$A$1:$I$308</definedName></definedNames></workbook>')
    templateZip.file('xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="5">
      <c r="A5" t="inlineStr"><is><t>0-1</t></is></c>
      <c r="C5" s="10"/>
      <c r="D5" s="10"/>
      <c r="E5" s="10"/>
      <c r="F5" s="10"/>
      <c r="H5" s="10"/>
    </row>
    <row r="6">
      <c r="A6" t="inlineStr"><is><t>0-2</t></is></c>
      <c r="C6" s="10"/>
      <c r="D6" s="10"/>
      <c r="E6" s="10"/>
      <c r="F6" s="10"/>
      <c r="H6" s="10"/>
    </row>
  </sheetData>
  <rowBreaks count="1" manualBreakCount="1">
    <brk id="48" max="16383" man="1"/>
  </rowBreaks>
</worksheet>`)
    templateZip.file('xl/drawings/drawing1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <xdr:twoCellAnchor><xdr:cxnSp><xdr:nvCxnSpPr><xdr:cNvPr id="38" name="Connector 38"/></xdr:nvCxnSpPr></xdr:cxnSp></xdr:twoCellAnchor>
  <xdr:twoCellAnchor><xdr:cxnSp><xdr:nvCxnSpPr><xdr:cNvPr id="39" name="Connector 39"/></xdr:nvCxnSpPr></xdr:cxnSp></xdr:twoCellAnchor>
</xdr:wsDr>`)

    const templateBuffer = await templateZip.generateAsync({ type: 'nodebuffer' })

    const result = await generateRemoteReportExcel({
      templateBuffer,
      circuits: [
        {
          uniqueKey: '1L-1-1',
          densoKeiTo: '1',
          fukaAddress: '0-1',
          banMeisho: '1L-1',
          kairoBangou: '1',
          kairoMeisho: '事務室\n照明\n(200V)',
          kairoKigou: 'dl',
          relayNumber: 'R1',
          isVacant: false,
        },
        {
          uniqueKey: '1L-1-2',
          densoKeiTo: '1',
          fukaAddress: '0-2',
          banMeisho: '1L-1',
          kairoBangou: '',
          kairoMeisho: '',
          relayNumber: '',
          isVacant: true, // T/U余り
        },
      ],
      config: { assignments: {} } as RemoteControlConfig,
      siteName: 'テスト現場',
      symbolOptions: {
        enabled: true,
      },
    })

    const origZip = await JSZip.loadAsync(templateBuffer)
    const outZip = await JSZip.loadAsync(result.buffer)

    // 1. styles.xml が原本と 100% 同一（DXF や numFmt の改変・破壊がゼロ）
    const origStyles = await origZip.file('xl/styles.xml')!.async('string')
    const outStyles = await outZip.file('xl/styles.xml')!.async('string')

    expect(outStyles).toBe(origStyles)

    // 2. workbook.xml が原本と 100% 同一（印刷範囲 $A$1:$I$308 の改変・破壊がゼロ）
    const origWbXml = await origZip.file('xl/workbook.xml')!.async('string')
    const outWbXml = await outZip.file('xl/workbook.xml')!.async('string')

    expect(outWbXml).toBe(origWbXml)

    // 3. 改ページ (rowBreaks) が原本と 100% 同一（手動改ページの破壊がゼロ）
    const origSheetXml = await origZip.file('xl/worksheets/sheet1.xml')!.async('string')
    const outSheetXml = await outZip.file('xl/worksheets/sheet1.xml')!.async('string')
    const origBreaks = origSheetXml.match(/<rowBreaks[\s\S]*?<\/rowBreaks>/)?.[0]
    const outBreaks = outSheetXml.match(/<rowBreaks[\s\S]*?<\/rowBreaks>/)?.[0]

    expect(outBreaks).toBe(origBreaks)

    // 4. drawing1.xml に原本のコネクタ（id=38, 39）が温存され、新しい回路記号（id=40）が競合なく追加されていること
    const outDrawing = await outZip.file('xl/drawings/drawing1.xml')!.async('string')

    expect(outDrawing).toContain('id="38"')
    expect(outDrawing).toContain('id="39"')
    expect(outDrawing).toContain('id="40"')
    expect(outDrawing).toContain('Symbol dl')

    // 5. C5, D5, E5, F5, H5 および C6, D6, E6, F6, H6 のデータ検証
    expect(outSheetXml).toContain('1L-1')
    expect(outSheetXml).toContain('事務室 照明 (200V)') // 改行が半角スペースに整形
    expect(outSheetXml).toContain('良') // 通常行の動作良否
    expect(outSheetXml).toContain('R1')

    // ファイル名がシンプルであること
    expect(result.filename).toBe('テスト現場_リモコン設定表.xlsx')
  })
})
