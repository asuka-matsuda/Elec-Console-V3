/**
 * リモコン設定表 Excel 帳票生成エンジン
 *
 * @description 回路台帳から負荷アドレス一覧を抽出し、
 * リモコン設定表テンプレート（アドレス表、グループ設定表、パターン設定表）へ
 * 盤名称・負荷名称・グループ割り当て・パターン割り当てを流し込みます。
 */
import ExcelJS from 'exceljs'

import type {
  RawRemoteRow,
  RemoteCircuitItem,
  RemoteControlConfig,
  RemoteExportTarget,
  RemoteGroupSummary,
  RemotePatternSummary,
} from '#shared/types/remoteControl'
import {
  cellValueToString,
  normalizeHeaderName,
} from '#shared/utils/excelNormalize'

import { formatDateTime } from './date'

/**
 * 回路台帳Excel（または原本Excel）から伝送系統ごとに 0-1〜63-4 の256スロットを構築
 * ヒットする回路は盤名称・回路記号・回路番号・負荷名称をマッピングし、ヒットしないアドレスは「空き」とする。
 */
export async function extractRemoteCircuitsFromExcel(
  excelBuffer: ArrayBuffer | Uint8Array,
): Promise<RemoteCircuitItem[]> {
  const workbook = new ExcelJS.Workbook()

  await workbook.xlsx.load(excelBuffer as unknown as ExcelJS.Buffer)

  let sheet = workbook.worksheets.find(s => /回路|盤|台帳|List/i.test(s.name))

  if (!sheet) {
    sheet = workbook.worksheets[0]
  }
  if (!sheet) return []

  // ヘッダー行の検出（見出し語の一致スコア優先）
  const HEADER_TARGETS = [
    '伝送系統', '伝送',
    '負荷アドレス', '負荷ｱﾄﾞﾚｽ', 'アドレス', 'ｱﾄﾞﾚｽ',
    '盤名称', '分電盤名称', '盤名',
    '回路記号',
    '回路番号', '回路no',
    '回路名称', '回路名', '負荷名称',
    'リレー番号', 'ﾘﾚｰ番号', '機器番号',
  ]
  const targetNorms = new Set(HEADER_TARGETS.map(normalizeHeaderName))

  let headerRowIndex = 1
  let maxScore = -1
  let maxColCount = 0
  const scanLimit = Math.min(sheet.rowCount || 10, 10)

  for (let r = 1; r <= scanLimit; r++) {
    const row = sheet.getRow(r)
    let score = 0
    let count = 0

    row.eachCell({ includeEmpty: false }, (cell) => {
      const val = cellValueToString(cell.value)

      if (val) {
        count++
        if (targetNorms.has(normalizeHeaderName(val))) {
          score++
        }
      }
    })

    if (score > maxScore || (score === maxScore && count > maxColCount)) {
      maxScore = score
      maxColCount = count
      headerRowIndex = r
    }
  }

  const headerRow = sheet.getRow(headerRowIndex)
  let densoKeiToCol = -1
  let fukaAddressCol = -1
  let banMeishoCol = -1
  let kairoKigouCol = -1
  let kairoBangouCol = -1
  let kairoMeishoCol = -1
  let relayNumberCol = -1

  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const norm = normalizeHeaderName(cellValueToString(cell.value))

    if (/伝送系統|伝送/.test(norm) && densoKeiToCol === -1) {
      densoKeiToCol = colNumber
    }
    else if (/負荷アドレス|負荷ｱﾄﾞﾚｽ|アドレス|ｱﾄﾞﾚｽ/.test(norm) && fukaAddressCol === -1) {
      fukaAddressCol = colNumber
    }
    else if (/盤名称|分電盤名称|盤名/.test(norm) && banMeishoCol === -1) {
      banMeishoCol = colNumber
    }
    else if (/回路記号/.test(norm) && kairoKigouCol === -1) {
      kairoKigouCol = colNumber
    }
    else if (/回路番号|回路no/.test(norm) && kairoBangouCol === -1) {
      kairoBangouCol = colNumber
    }
    else if (/負荷名称|回路名称|回路名/.test(norm) && kairoMeishoCol === -1) {
      kairoMeishoCol = colNumber
    }
    else if (/リレー番号|ﾘﾚｰ番号|機器番号/.test(norm) && relayNumberCol === -1) {
      relayNumberCol = colNumber
    }
  })

  if (fukaAddressCol === -1) {
    return []
  }

  const circuitMap = new Map<string, RawRemoteRow>()
  const densoSet = new Set<string>()
  const dataStartRow = headerRowIndex + 1

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < dataStartRow) return

    const addrRaw = cellValueToString(row.getCell(fukaAddressCol).value).trim()
    const addr = normalizeHeaderName(addrRaw)

    if (!addr || addr === '-' || addr === '0-0') return

    const rawDenso = densoKeiToCol !== -1 ? cellValueToString(row.getCell(densoKeiToCol).value).trim() : ''
    const denso = rawDenso || '1'

    densoSet.add(denso)

    const ban = banMeishoCol !== -1 ? cellValueToString(row.getCell(banMeishoCol).value).trim() : ''
    const kigou = kairoKigouCol !== -1 ? cellValueToString(row.getCell(kairoKigouCol).value).trim() : ''
    const no = kairoBangouCol !== -1 ? cellValueToString(row.getCell(kairoBangouCol).value).trim() : ''
    const name = kairoMeishoCol !== -1 ? cellValueToString(row.getCell(kairoMeishoCol).value).trim() : ''
    const relay = relayNumberCol !== -1 ? cellValueToString(row.getCell(relayNumberCol).value).trim() : ''

    const key = `${denso}:${addr}`

    circuitMap.set(key, {
      banMeisho: ban || '-',
      kairoKigou: kigou || null,
      kairoBangou: no || '-',
      kairoMeisho: name || '空き',
      relayNumber: relay || undefined,
    })
  })

  // 伝送系統ごとに 0-1 〜 63-4 の 256 スロットを用意
  const densoList = densoSet.size > 0 ? Array.from(densoSet).sort() : ['1']
  const circuits: RemoteCircuitItem[] = []

  for (const denso of densoList) {
    for (let ch = 0; ch <= 63; ch++) {
      for (let sub = 1; sub <= 4; sub++) {
        const addr = `${ch}-${sub}`
        const key = `${denso}:${normalizeHeaderName(addr)}`
        const matched = circuitMap.get(key)
        const uniqueKey = densoList.length > 1 ? `${denso}:${addr}` : addr

        if (matched) {
          circuits.push({
            id: `rc-${denso}-${addr}`,
            siteId: '',
            uniqueKey,
            densoKeiTo: denso,
            fukaAddress: addr,
            banMeisho: matched.banMeisho,
            kairoKigou: matched.kairoKigou,
            kairoBangou: matched.kairoBangou,
            kairoMeisho: matched.kairoMeisho,
            relayNumber: matched.relayNumber,
            isVacant: false,
          })
        }
        else {
          circuits.push({
            id: `rc-${denso}-${addr}`,
            siteId: '',
            uniqueKey,
            densoKeiTo: denso,
            fukaAddress: addr,
            banMeisho: '-',
            kairoKigou: null,
            kairoBangou: '-',
            kairoMeisho: '空き',
            isVacant: true,
          })
        }
      }
    }
  }

  return circuits
}

/**
 * リモコン設定データからグループごとのアドレス集計一覧を算出
 */
export function buildGroupSummaries(
  config: RemoteControlConfig,
  maxGroups: number = 127,
): RemoteGroupSummary[] {
  const summaries: RemoteGroupSummary[] = []

  for (let g = 1; g <= maxGroups; g++) {
    const groupKey = `G${g}`
    const addrs: string[] = []

    for (const [addr, assign] of Object.entries(config.assignments)) {
      if (assign.groups && assign.groups.includes(g)) {
        addrs.push(addr)
      }
    }

    // アドレスソート (例: 1-1, 1-2, 2-1 ...)
    addrs.sort((a, b) => {
      const [a1, a2] = a.split('-').map(Number)
      const [b1, b2] = b.split('-').map(Number)

      if (a1 !== b1) return (a1 || 0) - (b1 || 0)

      return (a2 || 0) - (b2 || 0)
    })

    summaries.push({
      groupNumber: g,
      groupKey,
      addresses: addrs,
      addressText: addrs.join('  '), // 半角スペース2つ区切り
      remarks: config.groupRemarks?.[groupKey] || '',
    })
  }

  return summaries
}

/**
 * リモコン設定データからパターンごとのアドレス集計一覧を算出
 */
export function buildPatternSummaries(
  config: RemoteControlConfig,
  maxPatterns: number = 72,
): RemotePatternSummary[] {
  const summaries: RemotePatternSummary[] = []

  for (let p = 1; p <= maxPatterns; p++) {
    for (const action of ['ON', 'OFF']) {
      const patternKey = `P${p} ${action}`
      const addrs: string[] = []

      for (const [addr, assign] of Object.entries(config.assignments)) {
        if (assign.patterns && assign.patterns.includes(patternKey)) {
          addrs.push(addr)
        }
      }

      addrs.sort((a, b) => {
        const [a1, a2] = a.split('-').map(Number)
        const [b1, b2] = b.split('-').map(Number)

        if (a1 !== b1) return (a1 || 0) - (b1 || 0)

        return (a2 || 0) - (b2 || 0)
      })

      summaries.push({
        patternKey,
        addresses: addrs,
        addressText: addrs.join('  '),
        remarks: config.patternRemarks?.[patternKey] || '',
      })
    }
  }

  return summaries
}

export interface GenerateRemoteReportOptions {
  templateBuffer?: ArrayBuffer | Uint8Array | null
  circuits: RemoteCircuitItem[]
  config: RemoteControlConfig
  siteName?: string
  exportTarget?: RemoteExportTarget
}

export interface RemoteReportResult {
  buffer: Uint8Array
  filename: string
  totalAddresses: number
  configuredGroups: number
  configuredPatterns: number
}

/**
 * リモコン設定表 Excel 帳票を生成（アドレス表、グループ、パターンの3パターンに対応）
 * テンプレートExcelが指定された場合はそのテンプレートへ流し込み、
 * 指定されない場合は高品位な新規ワークブックを自動生成します。
 */
export async function generateRemoteReportExcel(
  options: GenerateRemoteReportOptions,
): Promise<RemoteReportResult> {
  const { templateBuffer, circuits, config, siteName = '', exportTarget } = options

  let workbook: ExcelJS.Workbook

  if (templateBuffer) {
    workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(templateBuffer as unknown as ExcelJS.Buffer)

    // 回路のマップ構築（キー: fukaAddress, uniqueKey, denso:fukaAddress）
    const circuitMap = new Map<string, RemoteCircuitItem>()

    circuits.forEach((c) => {
      circuitMap.set(c.fukaAddress.trim(), c)
      circuitMap.set(c.uniqueKey, c)
      circuitMap.set(`${c.densoKeiTo}:${c.fukaAddress}`, c)
    })

    // グループ集計・パターン集計
    const groupSummaries = buildGroupSummaries(config)
    const patternSummaries = buildPatternSummaries(config)

    const groupTextMap = new Map<string, string>()
    const groupMeishoMap = new Map<string, string>()

    groupSummaries.forEach((g) => {
      groupTextMap.set(g.groupKey.toUpperCase(), g.addressText)
      groupTextMap.set(String(g.groupNumber), g.addressText)

      const meishos = g.addresses
        .map(addr => circuitMap.get(addr)?.kairoMeisho || '')
        .filter(m => m && m !== '空き' && m !== '-')
      const meishoText = meishos.join('  ')

      groupMeishoMap.set(g.groupKey.toUpperCase(), meishoText)
      groupMeishoMap.set(String(g.groupNumber), meishoText)
    })

    const patternTextMap = new Map<string, string>()
    const patternMeishoMap = new Map<string, string>()

    patternSummaries.forEach((p) => {
      patternTextMap.set(normalizeHeaderName(p.patternKey), p.addressText)

      const meishos = p.addresses
        .map(addr => circuitMap.get(addr)?.kairoMeisho || '')
        .filter(m => m && m !== '空き' && m !== '-')

      patternMeishoMap.set(normalizeHeaderName(p.patternKey), meishos.join('  '))
    })

    // 各シートの流し込み処理
    workbook.worksheets.forEach((sheet) => {
      const sName = sheet.name

      // A. グループ設定表シートの処理
      if (/ｸﾞﾙｰﾌﾟ|グループ/i.test(sName)) {
        fillGroupSettingSheet(sheet, groupTextMap, groupMeishoMap, siteName)
      }
      // B. パターン設定表シートの処理
      else if (/ﾊﾟﾀｰﾝ|パターン/i.test(sName)) {
        fillPatternSettingSheet(sheet, patternTextMap, patternMeishoMap, siteName)
      }
      // C. アドレス表シートの処理
      else if (/ｱﾄﾞﾚｽ表|アドレス表/i.test(sName)) {
        fillAddressTableSheet(sheet, circuitMap, config, siteName)
      }
    })

    // 3パターン指定時（'address' | 'group' | 'pattern'）に対象外シートを削除
    if (exportTarget) {
      const sheetsToRemove: ExcelJS.Worksheet[] = []

      workbook.worksheets.forEach((sheet) => {
        const sName = sheet.name
        const isMatch
          = (exportTarget === 'group' && /ｸﾞﾙｰﾌﾟ|グループ/i.test(sName))
            || (exportTarget === 'pattern' && /ﾊﾟﾀｰﾝ|パターン/i.test(sName))
            || (exportTarget === 'address' && /ｱﾄﾞﾚｽ表|アドレス表/i.test(sName))

        if (!isMatch) {
          sheetsToRemove.push(sheet)
        }
      })

      // 対象シートが存在する場合のみ他シートを削除（全削除で空ブックになるのを防ぐ）
      if (sheetsToRemove.length < workbook.worksheets.length) {
        sheetsToRemove.forEach((s) => {
          workbook.removeWorksheet(s.id)
        })
      }
    }
  }
  else {
    // テンプレートが指定されていない場合: 新規ワークブックを自動生成
    workbook = createNewRemoteReportWorkbook({
      circuits,
      config,
      siteName,
      exportTarget: exportTarget || 'address',
    })
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const groupSummaries = buildGroupSummaries(config)
  const patternSummaries = buildPatternSummaries(config)
  const configuredGroups = groupSummaries.filter(g => g.addresses.length > 0).length
  const configuredPatterns = patternSummaries.filter(p => p.addresses.length > 0).length

  let targetSuffix = 'リモコン設定表'

  if (exportTarget === 'address') targetSuffix = 'リモコン設定表_アドレス表'
  else if (exportTarget === 'group') targetSuffix = 'リモコン設定表_グループ設定'
  else if (exportTarget === 'pattern') targetSuffix = 'リモコン設定表_パターン設定'

  const filename = `${siteName ? `${siteName}_` : ''}${targetSuffix}_${circuits.length}件.xlsx`

  return {
    buffer: new Uint8Array(buffer),
    filename,
    totalAddresses: circuits.length,
    configuredGroups,
    configuredPatterns,
  }
}

/**
 * テンプレートなし時に新規ワークブックを自動生成（アドレス表、グループ、パターンの3パターンに対応）
 */
function createNewRemoteReportWorkbook(options: {
  circuits: RemoteCircuitItem[]
  config: RemoteControlConfig
  siteName: string
  exportTarget?: RemoteExportTarget
}): ExcelJS.Workbook {
  const { circuits, config, siteName, exportTarget } = options
  const workbook = new ExcelJS.Workbook()
  const now = new Date(Date.now())

  workbook.creator = 'Elec-Console'
  workbook.lastModifiedBy = 'Elec-Console'
  workbook.created = now
  workbook.modified = now

  // 1. アドレス表シート
  if (!exportTarget || exportTarget === 'address') {
    createStandaloneAddressSheet(workbook, circuits, config, siteName)
  }

  // 2. グループ設定表シート
  if (!exportTarget || exportTarget === 'group') {
    createStandaloneGroupSheet(workbook, config, siteName)
  }

  // 3. パターン設定表シート
  if (!exportTarget || exportTarget === 'pattern') {
    createStandalonePatternSheet(workbook, config, siteName)
  }

  return workbook
}

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1E3A8A' }, // 濃紺
}

const HEADER_FONT: Partial<ExcelJS.Font> = {
  name: 'Meiryo',
  size: 10,
  bold: true,
  color: { argb: 'FFFFFFFF' },
}

const BORDER_STYLE: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
}

/**
 * 新規 アドレス表シートの生成
 */
function createStandaloneAddressSheet(
  workbook: ExcelJS.Workbook,
  circuits: RemoteCircuitItem[],
  config: RemoteControlConfig,
  siteName: string,
) {
  const sheet = workbook.addWorksheet('アドレス表')

  // タイトル行
  sheet.mergeCells('A1:I1')
  const titleCell = sheet.getCell('A1')

  titleCell.value = `リモコン設定 アドレス表 ${siteName ? `[${siteName}]` : ''}`
  titleCell.font = { name: 'Meiryo', size: 14, bold: true, color: { argb: 'FF0F172A' } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' }
  sheet.getRow(1).height = 28

  // サブヘッダー（出力日時など）
  const timestamp = formatDateTime(new Date(Date.now()), '-', { withSeconds: true })

  sheet.getCell('A2').value = `出力日時: ${timestamp} / 総アドレス数: ${circuits.length}件`
  sheet.getCell('A2').font = { name: 'Meiryo', size: 9, color: { argb: 'FF64748B' } }
  sheet.getRow(2).height = 18

  // ヘッダー行
  const headers = [
    '系統',
    '負荷アドレス',
    '盤名称',
    '記号',
    '回路番号',
    '負荷名称',
    'リレー番号',
    '設定グループ',
    '設定パターン',
  ]
  const headerRow = sheet.getRow(3)

  headerRow.values = headers
  headerRow.height = 24
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = BORDER_STYLE
  })

  // 列幅定義
  sheet.columns = [
    { key: 'densoKeiTo', width: 8 },
    { key: 'fukaAddress', width: 14 },
    { key: 'banMeisho', width: 16 },
    { key: 'kairoKigou', width: 10 },
    { key: 'kairoBangou', width: 12 },
    { key: 'kairoMeisho', width: 32 },
    { key: 'relayNumber', width: 12 },
    { key: 'groups', width: 20 },
    { key: 'patterns', width: 24 },
  ]

  // データ行追加
  circuits.forEach((c) => {
    const assign = config.assignments[c.fukaAddress] || config.assignments[c.uniqueKey]
    const gText = assign?.groups?.length ? assign.groups.map(g => `G${g}`).join(', ') : ''
    const pText = assign?.patterns?.length ? assign.patterns.join(', ') : ''

    const row = sheet.addRow([
      c.densoKeiTo || '1',
      c.fukaAddress,
      c.banMeisho || '-',
      c.kairoKigou || '',
      c.kairoBangou || '-',
      c.kairoMeisho || (c.isVacant ? '空き' : '-'),
      assign?.relayNumber || c.relayNumber || '',
      gText,
      pText,
    ])

    row.height = 20
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Meiryo', size: 9.5 }
      cell.border = BORDER_STYLE

      // センタリング設定
      if ([1, 2, 4, 5, 7].includes(colNumber)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      }
      else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' }
      }

      // 空きスロットの場合は淡い文字色
      if (c.isVacant) {
        cell.font = { name: 'Meiryo', size: 9.5, color: { argb: 'FF94A3B8' } }
      }
    })
  })
}

/**
 * 新規 グループ設定表シートの生成
 */
function createStandaloneGroupSheet(
  workbook: ExcelJS.Workbook,
  config: RemoteControlConfig,
  siteName: string,
) {
  const sheet = workbook.addWorksheet('グループ設定表')

  sheet.mergeCells('A1:D1')
  const titleCell = sheet.getCell('A1')

  titleCell.value = `リモコン設定 グループ設定表 ${siteName ? `[${siteName}]` : ''}`
  titleCell.font = { name: 'Meiryo', size: 14, bold: true, color: { argb: 'FF0F172A' } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' }
  sheet.getRow(1).height = 28

  const timestamp = formatDateTime(new Date(Date.now()), '-', { withSeconds: true })

  sheet.getCell('A2').value = `出力日時: ${timestamp} (G1〜G127 対象アドレス一覧)`
  sheet.getCell('A2').font = { name: 'Meiryo', size: 9, color: { argb: 'FF64748B' } }
  sheet.getRow(2).height = 18

  const headers = ['グループ番号', '対象負荷アドレス一覧', '登録数', '備考']
  const headerRow = sheet.getRow(3)

  headerRow.values = headers
  headerRow.height = 24
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = BORDER_STYLE
  })

  sheet.columns = [
    { key: 'groupKey', width: 14 },
    { key: 'addressText', width: 44 },
    { key: 'count', width: 10 },
    { key: 'remarks', width: 24 },
  ]

  const summaries = buildGroupSummaries(config, 127)

  summaries.forEach((g) => {
    const row = sheet.addRow([
      g.groupKey,
      g.addressText,
      g.addresses.length > 0 ? g.addresses.length : '',
      g.remarks || '',
    ])

    row.height = 20
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Meiryo', size: 9.5 }
      cell.border = BORDER_STYLE

      if (colNumber === 1 || colNumber === 3) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      }
      else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' }
      }

      if (g.addresses.length === 0) {
        cell.font = { name: 'Meiryo', size: 9.5, color: { argb: 'FF94A3B8' } }
      }
      else if (colNumber === 1) {
        cell.font = { name: 'Meiryo', size: 9.5, bold: true, color: { argb: 'FF1D4ED8' } }
      }
    })
  })
}

/**
 * 新規 パターン設定表シートの生成
 */
function createStandalonePatternSheet(
  workbook: ExcelJS.Workbook,
  config: RemoteControlConfig,
  siteName: string,
) {
  const sheet = workbook.addWorksheet('パターン設定表')

  sheet.mergeCells('A1:E1')
  const titleCell = sheet.getCell('A1')

  titleCell.value = `リモコン設定 パターン設定表 ${siteName ? `[${siteName}]` : ''}`
  titleCell.font = { name: 'Meiryo', size: 14, bold: true, color: { argb: 'FF0F172A' } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' }
  sheet.getRow(1).height = 28

  const timestamp = formatDateTime(new Date(Date.now()), '-', { withSeconds: true })

  sheet.getCell('A2').value = `出力日時: ${timestamp} (P1〜P72 ON/OFF 対象アドレス一覧)`
  sheet.getCell('A2').font = { name: 'Meiryo', size: 9, color: { argb: 'FF64748B' } }
  sheet.getRow(2).height = 18

  const headers = ['パターン番号', '動作', '対象負荷アドレス一覧', '登録数', '備考']
  const headerRow = sheet.getRow(3)

  headerRow.values = headers
  headerRow.height = 24
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = BORDER_STYLE
  })

  sheet.columns = [
    { key: 'patternKey', width: 14 },
    { key: 'action', width: 10 },
    { key: 'addressText', width: 44 },
    { key: 'count', width: 10 },
    { key: 'remarks', width: 24 },
  ]

  const summaries = buildPatternSummaries(config, 72)

  summaries.forEach((p) => {
    const isON = p.patternKey.endsWith('ON')
    const action = isON ? 'ON' : 'OFF'
    const row = sheet.addRow([
      p.patternKey,
      action,
      p.addressText,
      p.addresses.length > 0 ? p.addresses.length : '',
      p.remarks || '',
    ])

    row.height = 20
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Meiryo', size: 9.5 }
      cell.border = BORDER_STYLE

      if (colNumber === 1 || colNumber === 2 || colNumber === 4) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      }
      else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' }
      }

      if (p.addresses.length === 0) {
        cell.font = { name: 'Meiryo', size: 9.5, color: { argb: 'FF94A3B8' } }
      }
      else if (colNumber === 2) {
        cell.font = {
          name: 'Meiryo',
          size: 9.5,
          bold: true,
          color: { argb: isON ? 'FFDC2626' : 'FF2563EB' },
        }
      }
    })
  })
}

/**
 * グループ設定表シートの流し込み
 */
function fillGroupSettingSheet(
  sheet: ExcelJS.Worksheet,
  groupTextMap: Map<string, string>,
  groupMeishoMap: Map<string, string>,
  siteName: string,
) {
  // 件名ヘッダーの反映
  sheet.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      const val = cellValueToString(cell.value)

      if (val === '件名' || val === '件　　名') {
        const nextCell = row.getCell(cell.col + 1)

        if (nextCell && siteName) {
          nextCell.value = siteName
        }
      }
    })
  })

  // 各行の走査: G番号の検出と、%アドレス% / %回路名称% セル（または対象アドレス列）への流し込み
  sheet.eachRow({ includeEmpty: false }, (row) => {
    let matchedGroupKey: string | null = null
    let targetAddressCell: ExcelJS.Cell | null = null
    let targetMeishoCell: ExcelJS.Cell | null = null

    row.eachCell({ includeEmpty: false }, (cell) => {
      const text = cellValueToString(cell.value).trim()

      // G1, G2 ... の記号判定 (大文字G + 数字)
      const m = text.match(/^G(\d+)$/i)

      if (m) {
        matchedGroupKey = `G${m[1]}`
      }

      // %アドレス% または %対象アドレス% タグの検出（全角・半角対応）
      if (/[%％](?:アドレス|ｱﾄﾞﾚｽ|対象アドレス|対象ｱﾄﾞﾚｽ)[%％]/i.test(text)) {
        targetAddressCell = cell
      }

      // %回路名称% または %負荷名称% タグの検出（全角・半角対応）
      if (/[%％](?:回路名称|負荷名称|回路名|負荷名)[%％]/i.test(text)) {
        targetMeishoCell = cell
      }
    })

    if (matchedGroupKey) {
      const addrText = groupTextMap.get(matchedGroupKey) || ''
      const meishoText = groupMeishoMap.get(matchedGroupKey) || ''

      // 1. %アドレス% タグがあれば最優先でそのセルへ書き込む
      if (targetAddressCell) {
        (targetAddressCell as ExcelJS.Cell).value = addrText
      }
      else {
        // 2. タグがなければ、標準の「対象アドレス」列（通常C列/Col 3）へ書き込む
        const col3Cell = row.getCell(3)

        col3Cell.value = addrText
      }

      // 3. %回路名称% / %負荷名称% タグがあれば名称一覧を書き込む
      if (targetMeishoCell) {
        (targetMeishoCell as ExcelJS.Cell).value = meishoText
      }

      // 「動作確認 / 良否」列（通常Col 8）があれば、アドレスが存在する場合に「良」をセット
      if (addrText) {
        const actionCell = row.getCell(8)

        if (actionCell && (!actionCell.value || actionCell.value === '良')) {
          actionCell.value = '良'
        }
      }
    }
  })
}

/**
 * パターン設定表シートの流し込み
 */
function fillPatternSettingSheet(
  sheet: ExcelJS.Worksheet,
  patternTextMap: Map<string, string>,
  patternMeishoMap: Map<string, string>,
  siteName: string,
) {
  sheet.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      const val = cellValueToString(cell.value)

      if (val === '件名' || val === '件　　名') {
        const nextCell = row.getCell(cell.col + 1)

        if (nextCell && siteName) {
          nextCell.value = siteName
        }
      }
    })
  })

  sheet.eachRow({ includeEmpty: false }, (row) => {
    let matchedPatternKey: string | null = null
    let targetAddressCell: ExcelJS.Cell | null = null
    let targetMeishoCell: ExcelJS.Cell | null = null

    row.eachCell({ includeEmpty: false }, (cell) => {
      const text = cellValueToString(cell.value).trim()

      // P1 ON, P1 OFF などの記号判定
      const norm = normalizeHeaderName(text)

      if (/^p\d+(on|off)$/.test(norm)) {
        matchedPatternKey = norm
      }

      if (/[%％](?:アドレス|ｱﾄﾞﾚｽ|対象アドレス|対象ｱﾄﾞﾚｽ)[%％]/i.test(text)) {
        targetAddressCell = cell
      }

      if (/[%％](?:回路名称|負荷名称|回路名|負荷名)[%％]/i.test(text)) {
        targetMeishoCell = cell
      }
    })

    if (matchedPatternKey) {
      const addrText = patternTextMap.get(matchedPatternKey) || ''
      const meishoText = patternMeishoMap.get(matchedPatternKey) || ''

      if (targetAddressCell) {
        (targetAddressCell as ExcelJS.Cell).value = addrText
      }
      else {
        const col3Cell = row.getCell(3)

        col3Cell.value = addrText
      }

      if (targetMeishoCell) {
        (targetMeishoCell as ExcelJS.Cell).value = meishoText
      }

      if (addrText) {
        const actionCell = row.getCell(8)

        if (actionCell && (!actionCell.value || actionCell.value === '良')) {
          actionCell.value = '良'
        }
      }
    }
  })
}

/**
 * アドレス表シートの流し込み
 */
function fillAddressTableSheet(
  sheet: ExcelJS.Worksheet,
  circuitMap: Map<string, RemoteCircuitItem>,
  config: RemoteControlConfig,
  _siteName: string,
) {
  // ヘッダー行と各列のインデックス特定
  let headerRowIndex = 3
  let fukaAddrCol = -1
  let banMeishoCol = -1
  let kairoBangouCol = -1
  let kairoMeishoCol = -1
  let groupCol = -1
  let relayCol = -1

  for (let r = 1; r <= Math.min(sheet.rowCount || 5, 5); r++) {
    const row = sheet.getRow(r)

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const text = cellValueToString(cell.value)
      const norm = normalizeHeaderName(text).replace(/[%％]/g, '')

      if (/負荷アドレス|負荷ｱﾄﾞﾚｽ/.test(norm)) {
        fukaAddrCol = colNumber
        headerRowIndex = r
      }
      else if (/盤名称|盤名/.test(norm)) {
        banMeishoCol = colNumber
      }
      else if (/回路番号/.test(norm)) {
        kairoBangouCol = colNumber
      }
      else if (/負荷名称|回路名称/.test(norm)) {
        kairoMeishoCol = colNumber
      }
      else if (/グループ設定|ｸﾞﾙｰﾌﾟ設定/.test(norm)) {
        if (groupCol === -1) groupCol = colNumber
      }
      else if (/リレー番号|ﾘﾚｰ番号/.test(norm)) {
        relayCol = colNumber
      }
    })
    if (fukaAddrCol !== -1) break
  }

  if (fukaAddrCol === -1) return

  // G1〜G127 のフラグ列マップ構築（例: Col 11 -> 1, Col 12 -> 2 ...）
  const gColMap = new Map<number, number>()
  const headerRow = sheet.getRow(headerRowIndex)

  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const text = cellValueToString(cell.value).trim()
    const m = text.match(/^G(\d+)$/i)

    if (m && m[1]) {
      gColMap.set(colNumber, parseInt(m[1], 10))
    }
  })

  // 各データ行の走査
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= headerRowIndex) return

    const addrCell = row.getCell(fukaAddrCol)
    const addr = cellValueToString(addrCell.value).trim()

    if (!addr || addr === '-') return

    const cItem = circuitMap.get(addr)
    const assign = config.assignments[addr]

    // 盤名称
    if (banMeishoCol !== -1 && cItem?.banMeisho) {
      row.getCell(banMeishoCol).value = cItem.banMeisho
    }
    // 回路番号
    if (kairoBangouCol !== -1 && cItem?.kairoBangou) {
      row.getCell(kairoBangouCol).value = cItem.kairoBangou
    }
    // 負荷名称 / 回路名称
    if (kairoMeishoCol !== -1 && cItem?.kairoMeisho) {
      row.getCell(kairoMeishoCol).value = cItem.kairoMeisho
    }
    // リレー番号
    if (relayCol !== -1 && assign?.relayNumber) {
      row.getCell(relayCol).value = assign.relayNumber
    }

    // グループ設定列（例: "1, 3"）
    if (groupCol !== -1 && assign?.groups && assign.groups.length > 0) {
      row.getCell(groupCol).value = assign.groups.join(', ')
    }

    // G1〜G127 列のフラグ設定
    if (gColMap.size > 0 && assign?.groups) {
      const gSet = new Set(assign.groups)

      gColMap.forEach((gNum, colNum) => {
        if (gSet.has(gNum)) {
          row.getCell(colNum).value = true
        }
      })
    }

    // セル内に直接 %回路名称% や ％回路名称％ などのタグが残っている場合も置換
    row.eachCell({ includeEmpty: false }, (cell) => {
      const val = cell.value

      if (typeof val === 'string' && (val.includes('%') || val.includes('％'))) {
        let str = val

        str = str.replace(/[%％](?:回路名称|負荷名称|回路名|負荷名)[%％]/g, cItem?.kairoMeisho || '')
        str = str.replace(/[%％](?:盤名称|盤名)[%％]/g, cItem?.banMeisho || '')
        str = str.replace(/[%％](?:回路番号)[%％]/g, cItem?.kairoBangou || '')
        str = str.replace(/[%％](?:リレー番号|ﾘﾚｰ番号)[%％]/g, assign?.relayNumber || cItem?.relayNumber || '')
        str = str.replace(/[%％](?:負荷アドレス|負荷ｱﾄﾞﾚｽ|アドレス|ｱﾄﾞﾚｽ)[%％]/g, addr)
        str = str.replace(/[%％](?:グループ設定|ｸﾞﾙｰﾌﾟ設定)[%％]/g, assign?.groups?.length ? assign.groups.join(', ') : '')
        cell.value = str
      }
    })
  })
}
