import ExcelJS from 'exceljs'
import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'

import type { CircuitItem } from '#shared/types/circuit'

import {
  calculateExamDateRange,
  calculateExamWorkers,
  evaluateOverallResult,
  evaluateShimePhase,
  generateExamReportExcel,
  generateExamReportsZip,
} from '../../app/utils/examReportExcel'

describe('examReportExcel', () => {
  const dummyCircuits: CircuitItem[] = [
    {
      id: 'c1',
      siteId: 'site-1',
      keiTo: '幹線',
      banShubetsu: '電灯',
      banMeisho: '1L-1',
      kairoBangou: '1',
      kairoMeisho: '事務室照明',
      haidenHoushiki: '1Φ3W 100/200V',
      cableList: 'VVF 2.0-3C',
      setsuchiUmu: '有',
      setsuchiList: 'D種',
      p1Kakunin: true,
      p1Mashishime: true,
      p1ConfirmedAt: '2026-09-20T10:00:00Z',
      p1Worker: '山田 太郎',
      p2IsComplete: true,
      p2ConfirmedAt: '2026-09-21T11:00:00Z',
      p2Worker: '佐藤 次郎',
      zetsuenR: 100,
      zetsuenS: 100,
      zetsuenT: 100,
      p3IsComplete: true,
      p3ConfirmedAt: '2026-09-22T14:00:00Z',
      p3Worker: '山田 太郎',
      denatsuRs: 102,
      denatsuSt: 102,
      denatsuRt: 204,
      kensou: '正',
      isExcluded: false,
    },
    {
      id: 'c2',
      siteId: 'site-1',
      keiTo: '幹線',
      banShubetsu: '電灯',
      banMeisho: '1L-1',
      kairoBangou: '2',
      kairoMeisho: 'コンセント\n(200V)',
      haidenHoushiki: '1Φ2W 200V',
      cableList: 'VVF 2.6-2C',
      setsuchiUmu: '無',
      setsuchiList: '-',
      p1Kakunin: true,
      p1Mashishime: true,
      p1ConfirmedAt: '2026-09-20T10:30:00Z',
      p1Worker: '鈴木 一郎',
      p2IsComplete: false,
      p2ConfirmedAt: null,
      p2Worker: null,
      p3IsComplete: false,
      p3ConfirmedAt: null,
      p3Worker: null,
      isExcluded: false,
    },
    {
      id: 'c3',
      siteId: 'site-1',
      keiTo: '幹線',
      banShubetsu: '動力',
      banMeisho: '1P-1',
      kairoBangou: '1',
      kairoMeisho: '空調',
      haidenHoushiki: '3Φ3W 200V',
      cableList: 'CV 5.5-3C',
      setsuchiUmu: '有',
      setsuchiList: 'D種',
      p1Kakunin: false,
      p1Mashishime: false,
      p1ConfirmedAt: null,
      p1Worker: null,
      p2IsComplete: false,
      p2ConfirmedAt: null,
      p2Worker: null,
      p3IsComplete: false,
      p3ConfirmedAt: null,
      p3Worker: null,
      isExcluded: true,
    },
  ]

  it('calculateExamDateRange: 最早日〜最遅日を正しく算出すること', () => {
    const range = calculateExamDateRange(dummyCircuits.filter(c => c.banMeisho === '1L-1'))

    expect(range).toBe('2026/09/20 ～ 2026/09/22')

    const emptyRange = calculateExamDateRange(dummyCircuits.filter(c => c.banMeisho === '1P-1'))

    expect(emptyRange).toBe('-')
  })

  it('calculateExamWorkers: 確定者全員を重複排除して連結すること', () => {
    const workers = calculateExamWorkers(dummyCircuits.filter(c => c.banMeisho === '1L-1'))

    expect(workers).toContain('山田 太郎')
    expect(workers).toContain('佐藤 次郎')
    expect(workers).toContain('鈴木 一郎')
    expect(workers.split(',').length).toBe(3)
  })

  it('evaluateShimePhase: 相別締付確認と除外相（-）を正しく判定すること', () => {
    const c1 = dummyCircuits[0] // 1Φ3W, 接地有, mashishime: true

    expect(evaluateShimePhase(c1, 'R')).toBe('✔')
    expect(evaluateShimePhase(c1, 'S')).toBe('✔')
    expect(evaluateShimePhase(c1, 'T')).toBe('✔')
    expect(evaluateShimePhase(c1, 'E')).toBe('✔')

    const c2 = dummyCircuits[1] // 1Φ2W 200V, 接地無, mashishime: true

    expect(evaluateShimePhase(c2, 'R')).toBe('✔')
    expect(evaluateShimePhase(c2, 'S')).toBe('-') // 1Φ2W 200VなのでS(N)なし
    expect(evaluateShimePhase(c2, 'T')).toBe('✔')
    expect(evaluateShimePhase(c2, 'E')).toBe('-') // 接地無
  })

  it('evaluateOverallResult: 全相完了で○、未完了で×、除外で-になること', () => {
    expect(evaluateOverallResult(dummyCircuits[0])).toBe('○')
    expect(evaluateOverallResult(dummyCircuits[1])).toBe('×')
    expect(evaluateOverallResult(dummyCircuits[2])).toBe('-')
  })

  it('generateExamReportExcel: テンプレートExcelのタグを置換してバッファを生成できること', async () => {
    const templateWb = new ExcelJS.Workbook()
    const sheet = templateWb.addWorksheet('1L-1')

    sheet.getCell('A1').value = '現場試験結果：%盤名称%'
    sheet.getCell('A2').value = '試験日：%試験日%'
    sheet.getCell('A3').value = '測定者：%測定者%'

    // 明細テンプレート行（行5）
    sheet.getCell('A5').value = '%回路番号%'
    sheet.getCell('B5').value = '%負荷名称%'
    sheet.getCell('C5').value = '%配電方式%'
    sheet.getCell('D5').value = '%総合結果%'

    const templateBuffer = await templateWb.xlsx.writeBuffer()

    const result = await generateExamReportExcel({
      templateBuffer,
      banMeisho: '1L-1',
      circuits: dummyCircuits,
    })

    expect(result.circuitsCount).toBe(2)
    expect(result.filename).toBe('1L-1_送電試験結果.xlsx')

    // 出力されたExcelを読み戻して検証
    const generatedWb = new ExcelJS.Workbook()

    await generatedWb.xlsx.load(result.buffer)
    const outSheet = generatedWb.getWorksheet('1L-1')!

    expect(outSheet.getCell('A1').value).toBe('現場試験結果：1L-1')
    expect(outSheet.getCell('A2').value).toBe('試験日：2026/09/20 ～ 2026/09/22')
    expect(outSheet.getCell('A5').value).toBe('1')
    expect(outSheet.getCell('B5').value).toBe('事務室照明')
    expect(outSheet.getCell('D5').value).toBe('○')

    expect(outSheet.getCell('A6').value).toBe('2')
    expect(outSheet.getCell('B6').value).toBe('コンセント\n(200V)')
    expect(outSheet.getCell('D6').value).toBe('×')
  })

  it('generateExamReportsZip: 複数盤のExcelをzipにまとめて出力できること', async () => {
    const templateWb = new ExcelJS.Workbook()
    const sheet = templateWb.addWorksheet('テンプレート')

    sheet.getCell('A1').value = '盤：%盤名称%'
    sheet.getCell('A3').value = '%回路番号%'
    sheet.getCell('B3').value = '%負荷名称%'

    const templateBuffer = await templateWb.xlsx.writeBuffer()

    const zipResult = await generateExamReportsZip({
      templateBuffer,
      banMeishoList: ['1L-1', '1P-1'],
      circuits: dummyCircuits,
      siteName: 'テスト現場',
    })

    expect(zipResult.totalCircuits).toBe(3)
    expect(zipResult.filename).toBe('テスト現場_送電試験結果_2盤.zip')

    // ZIPの内容物を検証
    const zip = new JSZip()
    const loadedZip = await zip.loadAsync(zipResult.buffer)
    const fileNames = Object.keys(loadedZip.files)

    expect(fileNames).toContain('1L-1_送電試験結果.xlsx')
    expect(fileNames).toContain('1P-1_送電試験結果.xlsx')
  })
})
