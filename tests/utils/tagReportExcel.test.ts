import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'

import type { CircuitItem } from '#shared/types/circuit'

import {
  convertCircuitsToDynamicRows,
  detectTagSlots,
  extractTableFromExcel,
  generateTagReportExcel,
  resolveValueOfKey,
  resolveValueOfTag,
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
    // 7. エイリアス関数resolveValueOfTagも同一であること
    expect(resolveValueOfTag(row, '設置場所')).toBe('B1F電気室')
  })

  it('detectTagSlots: A4ラベルテンプレートからタグ枠（スロット）を正しく検出すること', async () => {
    const wb = new ExcelJS.Workbook()
    const sheet = wb.addWorksheet('タグテンプレート')

    // 枠1: B2〜C3
    sheet.getCell('B2').value = '盤: %盤名称%'
    sheet.getCell('B3').value = '%回路名称%'
    // 枠2: E2〜F3
    sheet.getCell('E2').value = '盤: %盤名称%'
    sheet.getCell('E3').value = '%回路名称%'

    const { slots } = detectTagSlots(sheet, 'z')

    expect(slots).toHaveLength(2)
    expect(slots[0].cells).toHaveLength(2)
    expect(slots[1].cells).toHaveLength(2)
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

    const result = await generateTagReportExcel({
      templateBuffer,
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
    const outSheet = outWb.worksheets[0]

    // 1ページ目 枠1 (行2)
    expect(outSheet.getCell('A2').value).toBe('盤: 1L-1')
    expect(outSheet.getCell('B2').value).toBe('電灯幹線1')
    expect(outSheet.getCell('C2').value).toBe('線: CVT 60sq')
    expect(outSheet.getCell('D2').value).toBe('先: 1F')

    // 1ページ目 枠2 (行4)
    expect(outSheet.getCell('A4').value).toBe('盤: 1L-1')
    expect(outSheet.getCell('B4').value).toBe('電灯幹線2')
    expect(outSheet.getCell('C4').value).toBe('線: CVT 100sq')
    expect(outSheet.getCell('D4').value).toBe('先: 2F')

    // 1ページ目のもともとあった日付セル（E2）が日付形式を維持していること
    expect(outSheet.getCell('E2').numFmt).toBe('yyyy/mm/dd')
    expect(outSheet.getCell('E2').type).toBe(ExcelJS.ValueType.Date)

    // 2ページ目 枠1 (行6: 行2 + offset 4)
    expect(outSheet.getCell('A6').value).toBe('盤: 1P-1')
    expect(outSheet.getCell('B6').value).toBe('動力幹線1')
    expect(outSheet.getCell('C6').value).toBe('線: CVT 150sq')
    expect(outSheet.getCell('D6').value).toBe('先: RF')

    // 2ページ目に複製された日付セル（E6: E2 + offset 4）も日付形式を維持していること
    expect(outSheet.getCell('E6').numFmt).toBe('yyyy/mm/dd')
    expect(outSheet.getCell('E6').type).toBe(ExcelJS.ValueType.Date)

    // 2ページ目 枠2 (行8: 行4 + offset 4) -> 余剰枠なのでキーがクリアされていること
    expect(outSheet.getCell('A8').value).toBe('盤:')
    expect(outSheet.getCell('B8').value).toBe('')
    expect(outSheet.getCell('C8').value).toBe('線:')
    expect(outSheet.getCell('D8').value).toBe('先:')
  })
})
