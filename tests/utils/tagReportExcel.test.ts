import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'

import type { CircuitItem } from '#shared/types/circuit'

import {
  convertCircuitsToDynamicRows,
  extractTableFromExcel,
  generateTagReportExcel,
  resolveValueOfKey,
} from '../../app/utils/tagReportExcel'

describe('tagReportExcel', () => {
  it('convertCircuitsToDynamicRows: CircuitItem配列から動的ヘッダーと行データを生成できること', () => {
    const dummyCircuits: CircuitItem[] = [
      {
        id: 'c1',
        siteId: 'site-1',
        keiTo: '幹線',
        banShubetsu: '電灯',
        banMeisho: '1L-1',
        kairoBangou: '1',
        kairoMeisho: '幹線電灯A',
        cableList: 'CVT 100sq',
        p1Kakunin: false,
        p1Mashishime: false,
        p2IsComplete: false,
      },
    ]

    const result = convertCircuitsToDynamicRows(dummyCircuits, '2026/10/05')

    expect(result.headers.length).toBeGreaterThan(5)
    expect(result.headers.some(h => h.key === '盤名称')).toBe(true)
    expect(result.headers.some(h => h.key === '出力日時')).toBe(true)
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].banMeisho).toBe('1L-1')
    expect(result.rows[0].values['ケーブル']).toBe('CVT 100sq')
    expect(result.rows[0].values['出力日時']).toBe('2026/10/05')
    expect(result.rows[0].values['現場名']).toBeUndefined()
  })

  it('extractTableFromExcel: Excelワークブックからテーブル見出しと行データを動的抽出できること', async () => {
    const wb = new ExcelJS.Workbook()
    const sheet = wb.addWorksheet('回路一覧')

    // 1行目: ヘッダー（追加カスタム列「行き先」「施工フロア」を含む）
    sheet.getRow(1).values = ['盤名称', '回路番号', '回路名称', '電線', '行き先', '施工フロア']
    // 2行目: データ1
    sheet.getRow(2).values = ['1L-1', '1', '電灯幹線', 'CVT 60sq', '2F事務室', '2F']
    // 3行目: データ2
    sheet.getRow(3).values = ['1P-1', '2', '空調幹線', 'CVT 100sq', 'R階室外機', 'RF']

    const buffer = await wb.xlsx.writeBuffer()
    const result = await extractTableFromExcel(new Uint8Array(buffer))

    expect(result.headers.map(h => h.key)).toEqual([
      '盤名称',
      '回路番号',
      '回路名称',
      '電線',
      '行き先',
      '施工フロア',
    ])
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0].values['行き先']).toBe('2F事務室')
    expect(result.rows[0].values['施工フロア']).toBe('2F')
    expect(result.rows[1].values['電線']).toBe('CVT 100sq')
  })

  it('extractTableFromExcel: 文字列形式や日付・数値などのセル値を正しく抽出できること', async () => {
    const wb = new ExcelJS.Workbook()
    const sheet = wb.addWorksheet('回路一覧')

    sheet.getRow(1).values = ['盤名称', '回路番号', '測定時間', '試験日']
    sheet.getRow(2).values = ['1L-1', '1', '10:00', new Date('2026-09-20T00:00:00')]
    sheet.getRow(3).values = ['1P-1', '2', '14:00', new Date('2026-09-21T00:00:00')]

    const buffer = await wb.xlsx.writeBuffer()
    const result = await extractTableFromExcel(new Uint8Array(buffer))

    expect(result.rows[0].values['測定時間']).toBe('10:00')
    expect(result.rows[0].values['試験日']).toBe('2026/09/20')
    expect(result.rows[1].values['測定時間']).toBe('14:00')
    expect(result.rows[1].values['試験日']).toBe('2026/09/21')
  })

  it('extractTableFromExcel: 大分類カテゴリ行がある場合も個別見出し行を特定し、「系統」の値（一般電灯盤No.1等）を正しく抽出できること', async () => {
    const wb = new ExcelJS.Workbook()
    const sheet = wb.addWorksheet('List')

    // 1行目: エラー案内等
    sheet.getRow(1).values = ['案内メッセージ']
    // 2行目: 大分類カテゴリ
    sheet.getRow(2).values = ['系統', '系統', '基本情報', '基本情報', '基本情報']
    // 3行目: 個別列見出し
    sheet.getRow(3).values = ['系統', '盤名称', '盤種別', '幹線判定', '回路名称']
    // 4行目: データ
    sheet.getRow(4).values = ['一般電灯盤No.1', '1L-1', '電灯', 'true', '幹線1L-1']

    const buffer = await wb.xlsx.writeBuffer()
    const result = await extractTableFromExcel(new Uint8Array(buffer))

    expect(result.headers.map(h => h.key)).toEqual(['系統', '盤名称', '盤種別', '幹線判定', '回路名称'])
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].values['系統']).toBe('一般電灯盤No.1')
    expect(result.rows[0].values['幹線判定']).toBe('true')
    expect(result.rows[0].keiTo).toBe('幹線')
    expect(result.rows[0].banMeisho).toBe('1L-1')
  })

  it('extractTableFromExcel: 「配電盤MCCBNo.」等の列が前置されていても「盤名称」を誤認識せず正しく抽出できること', async () => {
    const wb = new ExcelJS.Workbook()
    const sheet = wb.addWorksheet('回路台帳')

    // 列見出し: 「配電盤MCCBNo.」が「盤名称」より左にある場合
    sheet.getRow(1).values = ['系統', '配電盤MCCBNo.', '配電盤遮断器容量', '盤名称', '回路名称']
    sheet.getRow(2).values = ['一般電灯盤No.1', '1', '200', '1L-1', '照明回路']
    sheet.getRow(3).values = ['一般電灯盤No.1', '2', '200', '1L-2', 'コンセント回路']

    const buffer = await wb.xlsx.writeBuffer()
    const result = await extractTableFromExcel(new Uint8Array(buffer))

    expect(result.rows).toHaveLength(2)
    // 配電盤MCCBNo.の "1" や "2" ではなく、盤名称列の "1L-1", "1L-2" が抽出されること
    expect(result.rows[0].banMeisho).toBe('1L-1')
    expect(result.rows[1].banMeisho).toBe('1L-2')
  })

  it('resolveValueOfKey: 完全一致・動的列・全角半角正規化・出力日時を解決し、互換エイリアスや現場名は解決しないこと', () => {
    const row = {
      banMeisho: '1L-1',
      keiTo: '幹線',
      values: {
        盤名称: '1L-1',
        回路名: '照明回路',
        電線: 'VVF 2.0-3C',
        設置場所: 'B1F電気室',
        測定時間: '10:00',
      },
    }

    // 1. 完全一致
    expect(resolveValueOfKey(row, '設置場所')).toBe('B1F電気室')
    // 2. 全角半角・スペースの正規化一致
    expect(resolveValueOfKey(row, '回路名')).toBe('照明回路')
    expect(resolveValueOfKey(row, '電線')).toBe('VVF 2.0-3C')
    // 3. 出力日時の解決
    expect(resolveValueOfKey(row, '出力日時', '2026/10/05')).toBe('2026/10/05')
    expect(resolveValueOfKey(row, '日付', '2026/10/05')).toBe('2026/10/05')
    // 4. 互換性キー（エイリアス）は解決しない（存在しない列名は空文字）
    expect(resolveValueOfKey(row, 'ケーブル')).toBe('')
    expect(resolveValueOfKey(row, '回路名称')).toBe('')
    // 5. 現場名は不要（空文字）
    expect(resolveValueOfKey(row, '現場名')).toBe('')
    // 6. 任意の動的列値の取得
    expect(resolveValueOfKey(row, '測定時間')).toBe('10:00')
  })

  it('generateTagReportExcel: テンプレートにデータを流し込み、余剰枠クリア＆自動改ページされること', async () => {
    const templateWb = new ExcelJS.Workbook()
    const sheet = templateWb.addWorksheet('タグテンプレート')

    // 1ページに2枠あるテンプレート (高さ4行)
    sheet.getCell('A2').value = '盤: %盤名称%'
    sheet.getCell('B2').value = '%回路名称%'
    sheet.getCell('C2').value = '線: %電線%'
    sheet.getCell('D2').value = '先: %行き先%'

    sheet.getCell('A4').value = '盤: %盤名称%'
    sheet.getCell('B4').value = '%回路名称%'
    sheet.getCell('C4').value = '線: %電線%'
    sheet.getCell('D4').value = '先: %行き先%'

    // テンプレートにもともと入っている日付形式のセル（E2）
    sheet.getCell('E2').value = new Date('2026-10-01T00:00:00.000Z')
    sheet.getCell('E2').numFmt = 'yyyy/mm/dd'

    const templateBuffer = await templateWb.xlsx.writeBuffer()

    // 3件のデータ（2枠/ページ なので 2ページ必要になる）
    const dummyRows = [
      {
        banMeisho: '1L-1',
        keiTo: '幹線',
        values: { 盤名称: '1L-1', 回路名称: '電灯幹線1', 電線: 'CVT 60sq', 行き先: '1F' },
      },
      {
        banMeisho: '1L-1',
        keiTo: '幹線',
        values: { 盤名称: '1L-1', 回路名称: '電灯幹線2', 電線: 'CVT 100sq', 行き先: '2F' },
      },
      {
        banMeisho: '1P-1',
        keiTo: '幹線',
        values: { 盤名称: '1P-1', 回路名称: '動力幹線1', 電線: 'CVT 150sq', 行き先: 'RF' },
      },
    ]

    const testTemplateDef = {
      id: 'test-2slot',
      name: 'テスト用2枠',
      pageHeight: 4,
      slotsPerPage: 2,
      match: () => true,
      getSlots: () => [
        {
          slotIndex: 0,
          cells: [
            { key: '盤名称', row: 2, col: 1 },
            { key: '回路名称', row: 2, col: 2 },
            { key: '電線', row: 2, col: 3 },
            { key: '行き先', row: 2, col: 4 },
          ],
        },
        {
          slotIndex: 1,
          cells: [
            { key: '盤名称', row: 4, col: 1 },
            { key: '回路名称', row: 4, col: 2 },
            { key: '電線', row: 4, col: 3 },
            { key: '行き先', row: 4, col: 4 },
          ],
        },
      ],
    }

    const result = await generateTagReportExcel({
      templateBuffer,
      templateDefinition: testTemplateDef,
      rows: dummyRows,
      siteName: 'テスト現場',
      flowDirection: 'z',
    })

    expect(result.totalTags).toBe(3)
    expect(result.totalPages).toBe(2)
    expect(result.filename).toBe('テスト現場_タグ線名札_3件.xlsx')

    // 出力されたExcelのセル内容を検証
    const outWb = new ExcelJS.Workbook()

    await outWb.xlsx.load(result.buffer as unknown as ExcelJS.Buffer)

    expect(outWb.worksheets.length).toBe(2)
    expect(outWb.worksheets[0].name).toBe('タグテンプレート (1)')
    expect(outWb.worksheets[1].name).toBe('タグテンプレート (2)')

    const sheet1 = outWb.worksheets[0]
    const sheet2 = outWb.worksheets[1]

    // 1ページ目 枠1 (行2)
    expect(sheet1.getCell('A2').value).toBe('盤: 1L-1')
    expect(sheet1.getCell('B2').value).toBe('電灯幹線1')
    expect(sheet1.getCell('C2').value).toBe('線: CVT 60sq')
    expect(sheet1.getCell('D2').value).toBe('先: 1F')

    // 1ページ目 枠2 (行4)
    expect(sheet1.getCell('A4').value).toBe('盤: 1L-1')
    expect(sheet1.getCell('B4').value).toBe('電灯幹線2')
    expect(sheet1.getCell('C4').value).toBe('線: CVT 100sq')
    expect(sheet1.getCell('D4').value).toBe('先: 2F')

    // 1ページ目のもともとあった日付セル（E2）が日付形式を維持していること
    expect(sheet1.getCell('E2').numFmt).toBe('yyyy/mm/dd')
    expect(sheet1.getCell('E2').type).toBe(ExcelJS.ValueType.Date)

    // 2ページ目（シート2） 枠1 (行2: シート複製なので行オフセット不要)
    expect(sheet2.getCell('A2').value).toBe('盤: 1P-1')
    expect(sheet2.getCell('B2').value).toBe('動力幹線1')
    expect(sheet2.getCell('C2').value).toBe('線: CVT 150sq')
    expect(sheet2.getCell('D2').value).toBe('先: RF')

    // 2ページ目に複製された日付セル（E2）も日付形式を維持していること
    expect(sheet2.getCell('E2').numFmt).toBe('yyyy/mm/dd')
    expect(sheet2.getCell('E2').type).toBe(ExcelJS.ValueType.Date)

    // 2ページ目（シート2） 枠2 (行4) -> 余剰枠なのでキーがクリアされていること
    expect(sheet2.getCell('A4').value).toBe('盤:')
    expect(sheet2.getCell('B4').value).toBe('')
    expect(sheet2.getCell('C4').value).toBe('線:')
    expect(sheet2.getCell('D4').value).toBe('先:')
  })
})
