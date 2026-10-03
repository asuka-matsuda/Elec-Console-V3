import ExcelJS from 'exceljs'
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

  it('generateRemoteReportExcel: 該当G/Pの%アドレス%セル（または対象列）へ正しく流し込まれること', async () => {
    const templateWb = new ExcelJS.Workbook()

    // 1. グループ設定表シート
    const grpSheet = templateWb.addWorksheet('ｸﾞﾙｰﾌﾟ設定表')

    grpSheet.getRow(3).values = ['グループ番号', '', '対象アドレス', '', '', '', '', '動作確認']
    grpSheet.getRow(4).values = ['G1', '', '%アドレス%', '', '', '', '', '']
    grpSheet.getRow(5).values = ['G2', '', '%アドレス%', '', '', '', '', '']

    // 2. パターン設定表シート
    const patSheet = templateWb.addWorksheet('ﾊﾟﾀｰﾝ設定表')

    patSheet.getRow(3).values = ['ﾊﾟﾀｰﾝ番号', '', '対象アドレス', '', '', '', '', '動作確認']
    patSheet.getRow(4).values = ['P1 ON', '', '%アドレス%', '', '', '', '', '']
    patSheet.getRow(5).values = ['P1 OFF', '', '%アドレス%', '', '', '', '', '']

    // 3. アドレス表シート
    const adrSheet = templateWb.addWorksheet('ｱﾄﾞﾚｽ表')

    adrSheet.getRow(3).values = ['管理番号', '盤名称', '回路番号', 'ﾘﾚｰ番号', '負荷ｱﾄﾞﾚｽ', '負荷名称', 'ｸﾞﾙｰﾌﾟ設定']
    adrSheet.getRow(4).values = ['1', '', '', '', '1-1', '', '']
    adrSheet.getRow(5).values = ['2', '', '', '', '1-2', '', '']

    const templateBuffer = await templateWb.xlsx.writeBuffer()

    const dummyCircuits: RemoteCircuitItem[] = [
      { id: '1', siteId: 's1', banMeisho: '1L-1', kairoBangou: '1', kairoMeisho: '事務所照明', fukaAddress: '1-1' },
      { id: '2', siteId: 's1', banMeisho: '1L-1', kairoBangou: '2', kairoMeisho: '倉庫照明', fukaAddress: '1-2' },
    ]

    const config: RemoteControlConfig = {
      assignments: {
        '1-1': { groups: [1, 2], patterns: ['P1 ON'] },
        '1-2': { groups: [1], patterns: [] },
      },
    }

    const result = await generateRemoteReportExcel({
      templateBuffer,
      circuits: dummyCircuits,
      config,
      siteName: 'テスト現場',
    })

    expect(result.totalAddresses).toBe(2)
    expect(result.configuredGroups).toBe(2)
    expect(result.configuredPatterns).toBe(1)

    // 出力Excelを読み込んでセル値を検証
    const outWb = new ExcelJS.Workbook()

    await outWb.xlsx.load(result.buffer as unknown as ExcelJS.Buffer)

    // グループ設定表の検証
    const outGrp = outWb.getWorksheet('ｸﾞﾙｰﾌﾟ設定表')!

    expect(outGrp.getCell('C4').value).toBe('1-1  1-2') // G1: 1-1, 1-2
    expect(outGrp.getCell('H4').value).toBe('良')
    expect(outGrp.getCell('C5').value).toBe('1-1') // G2: 1-1
    expect(outGrp.getCell('H5').value).toBe('良')

    // パターン設定表の検証
    const outPat = outWb.getWorksheet('ﾊﾟﾀｰﾝ設定表')!

    expect(outPat.getCell('C4').value).toBe('1-1') // P1 ON: 1-1
    expect(outPat.getCell('H4').value).toBe('良')

    // アドレス表の検証
    const outAdr = outWb.getWorksheet('ｱﾄﾞﾚｽ表')!

    expect(outAdr.getCell('B4').value).toBe('1L-1')
    expect(outAdr.getCell('C4').value).toBe('1')
    expect(outAdr.getCell('F4').value).toBe('事務所照明')
    expect(outAdr.getCell('G4').value).toBe('1, 2')
  })

  it('generateRemoteReportExcel: テンプレートなしで新規ワークブックを生成し、アドレス表シートが正しく含まれること', async () => {
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
      exportTarget: 'address',
    })

    const wb = new ExcelJS.Workbook()

    await wb.xlsx.load(result.buffer as unknown as ExcelJS.Buffer)

    expect(wb.worksheets.map(s => s.name)).toEqual(['アドレス表'])

    const adrSheet = wb.getWorksheet('アドレス表')!

    expect(adrSheet.getCell('A1').value).toContain('リモコン設定 アドレス表 [テスト現場]')
    expect(adrSheet.rowCount).toBeGreaterThanOrEqual(5) // タイトル + サブ + ヘッダー + 2データ行
  })

  it('generateRemoteReportExcel: 3パターンの個別出力（アドレス表、グループ、パターン）が正しく行われること', async () => {
    const dummyCircuits: RemoteCircuitItem[] = [
      { id: '1', siteId: 's1', uniqueKey: '1:1-1', densoKeiTo: '1', banMeisho: '1L-1', kairoBangou: '1', kairoMeisho: '事務所', fukaAddress: '1-1', isVacant: false },
    ]
    const config: RemoteControlConfig = {
      assignments: { '1-1': { groups: [1], patterns: ['P1 ON'] } },
    }

    // 1. アドレス表のみ
    const resAddr = await generateRemoteReportExcel({
      circuits: dummyCircuits,
      config,
      siteName: '現場A',
      exportTarget: 'address',
    })
    const wbAddr = new ExcelJS.Workbook()

    await wbAddr.xlsx.load(resAddr.buffer as unknown as ExcelJS.Buffer)
    expect(wbAddr.worksheets.map(s => s.name)).toEqual(['アドレス表'])
    expect(resAddr.filename).toContain('アドレス表')

    // 2. グループ設定表のみ
    const resGrp = await generateRemoteReportExcel({
      circuits: dummyCircuits,
      config,
      siteName: '現場A',
      exportTarget: 'group',
    })
    const wbGrp = new ExcelJS.Workbook()

    await wbGrp.xlsx.load(resGrp.buffer as unknown as ExcelJS.Buffer)
    expect(wbGrp.worksheets.map(s => s.name)).toEqual(['グループ設定表'])
    expect(resGrp.filename).toContain('グループ設定')

    // 3. パターン設定表のみ
    const resPat = await generateRemoteReportExcel({
      circuits: dummyCircuits,
      config,
      siteName: '現場A',
      exportTarget: 'pattern',
    })
    const wbPat = new ExcelJS.Workbook()

    await wbPat.xlsx.load(resPat.buffer as unknown as ExcelJS.Buffer)
    expect(wbPat.worksheets.map(s => s.name)).toEqual(['パターン設定表'])
    expect(resPat.filename).toContain('パターン設定')
  })
})
