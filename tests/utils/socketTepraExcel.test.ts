import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'

import type { TepraCircuitItem } from '#shared/types/socketTepra'
import { extractTepraCircuitsFromWorksheet } from '#shared/utils/socketTepraExtract'
import { generateSocketTepraExcel, sanitizeSheetName } from '~/utils/socketTepraExcel'

describe('socketTepraExtract', () => {
  it('extractTepraCircuitsFromWorksheet: 見出し検索で受口数のある回路のみを正しく抽出すること', () => {
    const wb = new ExcelJS.Workbook()
    const sheet = wb.addWorksheet('回路台帳')

    // 1行目: 見出し行（途中に「受口数」があるケース）
    sheet.getRow(1).values = ['No', '盤名称', '回路記号', '回路番号', '受口数', '回路名称']

    // 2行目: 2口コンセント (数値 2) -> 対象
    sheet.getRow(2).values = [1, '1L-1', 'C', '1', 2, '事務室OAコンセント']

    // 3行目: 照明回路 (受口数なし/空) -> スキップ
    sheet.getRow(3).values = [2, '1L-1', 'L', '2', null, '事務室照明']

    // 4行目: 3口コンセント (文字列 "3") -> 対象
    sheet.getRow(4).values = [3, '1L-1', 'C', '3', '3', '廊下コンセント']

    // 5行目: 受口数が 0 -> スキップ
    sheet.getRow(5).values = [4, '1L-2', 'C', '1', 0, '予備コンセント']

    // 6行目: 受口数が変な文字列 ("なし") -> スキップ
    sheet.getRow(6).values = [5, '1L-2', 'C', '2', 'なし', '屋外コンセント']

    // 7行目: 1口コンセント (数値 1) -> 対象
    sheet.getRow(7).values = [6, '1L-2', 'C', '3', 1, '給湯室コンセント']

    const circuits = extractTepraCircuitsFromWorksheet(sheet, 'site-test')

    expect(circuits).toHaveLength(3)

    // 行2
    expect(circuits[0]).toMatchObject({
      banMeisho: '1L-1',
      kairoKigou: 'C',
      kairoBangou: '1',
      kairoMeisho: '事務室OAコンセント',
      ukeguchiCount: 2,
    })

    // 行4
    expect(circuits[1]).toMatchObject({
      banMeisho: '1L-1',
      kairoKigou: 'C',
      kairoBangou: '3',
      kairoMeisho: '廊下コンセント',
      ukeguchiCount: 3,
    })

    // 行7
    expect(circuits[2]).toMatchObject({
      banMeisho: '1L-2',
      kairoKigou: 'C',
      kairoBangou: '3',
      kairoMeisho: '給湯室コンセント',
      ukeguchiCount: 1,
    })
  })

  it('受口数列がない場合は空配列を返すこと', () => {
    const wb = new ExcelJS.Workbook()
    const sheet = wb.addWorksheet('回路台帳')

    sheet.getRow(1).values = ['盤名称', '回路番号', '回路名称']
    sheet.getRow(2).values = ['1L-1', '1', '電灯']

    const circuits = extractTepraCircuitsFromWorksheet(sheet, 'site-test')

    expect(circuits).toHaveLength(0)
  })
})

describe('socketTepraExcel', () => {
  const dummyCircuits: TepraCircuitItem[] = [
    {
      id: '1',
      banMeisho: '1L-1',
      kairoBangou: '1',
      kairoKigou: 'C',
      kairoMeisho: 'コンセント1',
      ukeguchiCount: 2,
    },
    {
      id: '2',
      banMeisho: '1L-1',
      kairoBangou: '3',
      kairoKigou: 'C',
      kairoMeisho: 'コンセント3',
      ukeguchiCount: 3,
    },
    {
      id: '3',
      banMeisho: '1L-1',
      kairoBangou: '5',
      kairoKigou: 'E',
      kairoMeisho: '専用コンセント',
      ukeguchiCount: 1,
    },
    {
      id: '4',
      banMeisho: '1L-2',
      kairoBangou: '1',
      kairoKigou: 'C',
      kairoMeisho: '給湯室コンセント',
      ukeguchiCount: 2,
    },
  ]

  it('sanitizeSheetName: シート名禁止文字と長さを安全に整形すること', () => {
    expect(sanitizeSheetName('1L-1')).toBe('1L-1')
    expect(sanitizeSheetName('盤[1L/1]?*')).toBe('盤1L1')
    expect(sanitizeSheetName('a'.repeat(40))).toHaveLength(31)
    expect(sanitizeSheetName('')).toBe('Sheet')
  })

  it('盤ごとにシートが作成され、受口数の数だけ転記されること（全盤出力）', async () => {
    const result = await generateSocketTepraExcel({
      circuits: dummyCircuits,
      selectedBan: 'ALL',
      selectedKairoKigou: 'ALL',
      siteName: 'テスト現場',
    })

    // 合計枚数: 1L-1 (2 + 3 + 1 = 6枚) + 1L-2 (2枚) = 8枚
    expect(result.totalRows).toBe(8)
    expect(result.totalCircuits).toBe(4)
    expect(result.totalSheets).toBe(2)
    expect(result.filename).toContain('テスト現場_テプラ印刷_8枚.xlsx')

    // 出力Excelの検証
    const wb = new ExcelJS.Workbook()

    await wb.xlsx.load(result.buffer as unknown as ExcelJS.Buffer)

    expect(wb.worksheets).toHaveLength(2)

    // シート1: 1L-1
    const sheet1 = wb.getWorksheet('1L-1')

    expect(sheet1).toBeDefined()
    expect(sheet1!.getCell('A1').value).toBe('盤名称')
    expect(sheet1!.getCell('B1').value).toBe('回路番号')

    // 2行目は空行
    expect(sheet1!.getCell('A2').value).toBeNull()
    expect(sheet1!.getCell('B2').value).toBeNull()

    // 3行目〜 データ
    // 回路1: 2口 -> 行3, 行4
    expect(sheet1!.getCell('A3').value).toBe('1L-1')
    expect(sheet1!.getCell('B3').value).toBe('1')
    expect(sheet1!.getCell('A4').value).toBe('1L-1')
    expect(sheet1!.getCell('B4').value).toBe('1')

    // 回路3: 3口 -> 行5, 行6, 行7
    expect(sheet1!.getCell('A5').value).toBe('1L-1')
    expect(sheet1!.getCell('B5').value).toBe('3')
    expect(sheet1!.getCell('A6').value).toBe('1L-1')
    expect(sheet1!.getCell('B6').value).toBe('3')
    expect(sheet1!.getCell('A7').value).toBe('1L-1')
    expect(sheet1!.getCell('B7').value).toBe('3')

    // 回路5: 1口 -> 行8
    expect(sheet1!.getCell('A8').value).toBe('1L-1')
    expect(sheet1!.getCell('B8').value).toBe('5')

    // シート2: 1L-2 (2枚)
    const sheet2 = wb.getWorksheet('1L-2')

    expect(sheet2).toBeDefined()
    expect(sheet2!.getCell('A1').value).toBe('盤名称')
    expect(sheet2!.getCell('B1').value).toBe('回路番号')
    expect(sheet2!.getCell('A3').value).toBe('1L-2')
    expect(sheet2!.getCell('B3').value).toBe('1')
    expect(sheet2!.getCell('A4').value).toBe('1L-2')
    expect(sheet2!.getCell('B4').value).toBe('1')
  })

  it('回路記号で絞り込んだ場合、該当記号のみ出力されること', async () => {
    const result = await generateSocketTepraExcel({
      circuits: dummyCircuits,
      selectedBan: '1L-1',
      selectedKairoKigou: 'E',
      siteName: 'テスト現場',
    })

    // 1L-1 の 'E' は回路5（1口）のみ
    expect(result.totalRows).toBe(1)
    expect(result.totalCircuits).toBe(1)
    expect(result.totalSheets).toBe(1)

    const wb = new ExcelJS.Workbook()

    await wb.xlsx.load(result.buffer as unknown as ExcelJS.Buffer)

    const sheet = wb.getWorksheet('1L-1')

    expect(sheet!.getCell('A3').value).toBe('1L-1')
    expect(sheet!.getCell('B3').value).toBe('5')
    expect(sheet!.getCell('A4').value).toBeNull()
  })

  it('対象回路が0件の場合はエラーをスローすること', async () => {
    await expect(
      generateSocketTepraExcel({
        circuits: dummyCircuits,
        selectedBan: '存在しない盤',
      }),
    ).rejects.toThrow('出力対象の受口数（コンセント）回路がありません')
  })
})
