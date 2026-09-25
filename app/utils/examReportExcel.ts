/**
 * 送電試験結果 Excel 帳票生成エンジン（パーセント形式タグ置換・ZIP対応）
 *
 * @description ユーザー指定のテンプレート（.xlsx または .xlsm）内の %タグ% を検出し、
 * 選択した盤の試験結果を反映。マクロ（VBA）を維持したまま、単一または複数盤の ZIP 形式で生成します。
 */
import ExcelJS from 'exceljs'
import JSZip from 'jszip'

import type { MeasurementDevice } from '~/types/measurementDevice'
import type { CircuitItem } from '~/types/souden'
import { generateCircuitSymbolPng } from '~/utils/circuitSymbolImage'
import {
  isPhase1Complete,
  isPhase2Complete,
  isPhase3Complete,
} from '~/utils/souden'

export interface SelectedDevicesMap {
  megger?: MeasurementDevice | null
  voltmeter?: MeasurementDevice | null
  phaseDetector?: MeasurementDevice | null
}

export interface ExamReportOptions {
  templateBuffer: ArrayBuffer | Uint8Array
  banMeisho: string
  circuits: CircuitItem[]
  symbolSize?: number
  isXlsm?: boolean
  devices?: SelectedDevicesMap
}

export interface ExamReportResult {
  buffer: Uint8Array
  filename: string
  circuitsCount: number
}

export interface ExamReportZipOptions {
  templateBuffer: ArrayBuffer | Uint8Array
  banMeishoList: string[]
  circuits: CircuitItem[]
  symbolSize?: number
  isXlsm?: boolean
  siteName?: string
  devices?: SelectedDevicesMap
}

export interface TagMetadataItem {
  tag: string
  category: 'ヘッダー' | '基本情報' | 'フェーズ1' | 'フェーズ2' | 'フェーズ3' | '総合結果' | '測定機器'
  description: string
}

/**
 * テンプレート作成用タグ定義メタデータ（UIガイドと共有）
 */
export const TAG_METADATA: TagMetadataItem[] = [
  { tag: '%盤名称%', category: 'ヘッダー', description: '選択した盤名称（例: 1L-1）' },
  { tag: '%試験日%', category: 'ヘッダー', description: '確定日の最早日〜最遅日（例: 2026/09/20 ～ 2026/09/22）' },
  { tag: '%測定者%', category: 'ヘッダー', description: '確定欄に記載された作業者全員のカンマ連結' },
  { tag: '%回路記号%', category: '基本情報', description: '回路記号の背景透過画像（指定サイズで配置）' },
  { tag: '%回路番号%', category: '基本情報', description: '回路番号' },
  { tag: '%配電方式%', category: '基本情報', description: '配電方式（改行保持）' },
  { tag: '%ケーブルサイズ%', category: '基本情報', description: 'ケーブル情報（改行保持）' },
  { tag: '%負荷名称%', category: '基本情報', description: '回路名称・負荷名称（改行保持）' },
  { tag: '%サイズ確認%', category: 'フェーズ1', description: 'サイズ確認済みなら「✔」' },
  { tag: '%導通確認%', category: 'フェーズ1', description: 'フェーズ1完了（確認・増締）なら「✔」' },
  { tag: '%締付_R%', category: 'フェーズ1', description: 'R相の締付確認（「✔」または「-」）' },
  { tag: '%締付_S%', category: 'フェーズ1', description: 'S相/N相の締付確認（非対象は「-」）' },
  { tag: '%締付_T%', category: 'フェーズ1', description: 'T相の締付確認（非対象は「-」）' },
  { tag: '%締付_E%', category: 'フェーズ1', description: 'E相(接地)の締付確認（接地無は「-」）' },
  { tag: '%締付確認%', category: 'フェーズ1', description: '増締確認済みなら「✔」' },
  { tag: '%絶縁_R%', category: 'フェーズ2', description: 'R相の絶縁抵抗測定値（MΩ）' },
  { tag: '%絶縁_S%', category: 'フェーズ2', description: 'S相の絶縁抵抗測定値（MΩ）' },
  { tag: '%絶縁_T%', category: 'フェーズ2', description: 'T相の絶縁抵抗測定値（MΩ）' },
  { tag: '%絶縁判定%', category: 'フェーズ2', description: '絶縁判定（OK / NG / -）' },
  { tag: '%電圧_RS%', category: 'フェーズ3', description: 'RS間の電圧測定値（V）' },
  { tag: '%電圧_ST%', category: 'フェーズ3', description: 'ST間の電圧測定値（V）' },
  { tag: '%電圧_RT%', category: 'フェーズ3', description: 'RT間の電圧測定値（V）' },
  { tag: '%検相%', category: 'フェーズ3', description: '検相・点灯確認結果（正 / 良 / 逆 / 否）' },
  { tag: '%総合結果%', category: '総合結果', description: '全フェーズ完了なら「○」、未完了なら「×」' },
  { tag: '%絶縁計_製造者%', category: '測定機器', description: '選択した絶縁抵抗計の製造者（例: 日置電機）' },
  { tag: '%絶縁計_型式%', category: '測定機器', description: '選択した絶縁抵抗計の型式（例: IR4052-11）' },
  { tag: '%絶縁計_校正日%', category: '測定機器', description: '選択した絶縁抵抗計の校正年月日（例: 2026/04/01）' },
  { tag: '%絶縁計_製造番号%', category: '測定機器', description: '選択した絶縁抵抗計の製造番号（例: 230512345）' },
  { tag: '%電圧計_製造者%', category: '測定機器', description: '選択した電圧計の製造者（例: 共立電気計器）' },
  { tag: '%電圧計_型式%', category: '測定機器', description: '選択した電圧計の型式（例: 2002PA）' },
  { tag: '%電圧計_校正日%', category: '測定機器', description: '選択した電圧計の校正年月日（例: 2026/03/10）' },
  { tag: '%電圧計_製造番号%', category: '測定機器', description: '選択した電圧計の製造番号（例: 112233）' },
  { tag: '%検相器_製造者%', category: '測定機器', description: '選択した検相器の製造者（例: 日置電機）' },
  { tag: '%検相器_型式%', category: '測定機器', description: '選択した検相器の型式（例: 3129-10）' },
  { tag: '%検相器_校正日%', category: '測定機器', description: '選択した検相器の校正年月日（例: 2026/05/20）' },
  { tag: '%検相器_製造番号%', category: '測定機器', description: '選択した検相器の製造番号（例: 998877）' },
]

/**
 * 日付文字列から YYYY/MM/DD の日付キーを抽出
 */
function extractDateStr(dateVal: string | null | undefined): string | null {
  if (!dateVal) return null
  try {
    const d = new Date(dateVal)

    if (isNaN(d.getTime())) return null
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')

    return `${year}/${month}/${day}`
  }
  catch {
    return null
  }
}

/**
 * 対象盤の試験日（最早日〜最遅日）を算出
 */
export function calculateExamDateRange(circuits: CircuitItem[]): string {
  const dates: string[] = []

  for (const c of circuits) {
    const d1 = extractDateStr(c.p1ConfirmedAt)
    const d2 = extractDateStr(c.p2ConfirmedAt)
    const d3 = extractDateStr(c.p3ConfirmedAt)

    if (d1) dates.push(d1)
    if (d2) dates.push(d2)
    if (d3) dates.push(d3)
  }

  if (dates.length === 0) return '-'

  dates.sort()
  const earliest = dates[0]
  const latest = dates[dates.length - 1]

  if (!earliest || !latest) return '-'

  return earliest === latest ? earliest : `${earliest} ～ ${latest}`
}

/**
 * 対象盤の確定者全員（重複排除・カンマ連結）を算出
 */
export function calculateExamWorkers(circuits: CircuitItem[]): string {
  const workers = new Set<string>()

  for (const c of circuits) {
    if (c.p1Worker?.trim()) workers.add(c.p1Worker.trim())
    if (c.p2Worker?.trim()) workers.add(c.p2Worker.trim())
    if (c.p3Worker?.trim()) workers.add(c.p3Worker.trim())
  }

  if (workers.size === 0) return '-'

  return Array.from(workers).join(', ')
}

/**
 * 相別の締付確認結果（✔ / - / 空文字）を評価
 */
export function evaluateShimePhase(c: CircuitItem, phase: 'R' | 'S' | 'T' | 'E'): string {
  if (phase === 'E') {
    const hasSetsuchi = c.setsuchiUmu === '有'
      || (Boolean(c.setsuchiList) && c.setsuchiList !== '-' && c.setsuchiList !== '無')

    if (!hasSetsuchi) return '-'

    return c.p1Mashishime ? '✔' : ''
  }

  const haiden = (c.haidenHoushiki || '').trim()

  if (phase === 'R') {
    return c.p1Mashishime ? '✔' : ''
  }

  if (phase === 'S') {
    if (haiden.includes('1Φ2W') && (haiden.includes('200V') || c.kairoMeisho?.includes('200V'))) {
      return '-'
    }

    return c.p1Mashishime ? '✔' : ''
  }

  if (phase === 'T') {
    if (haiden.includes('1Φ2W') && (haiden.includes('100V') || !haiden.includes('200V'))) {
      return '-'
    }

    return c.p1Mashishime ? '✔' : ''
  }

  return ''
}

/**
 * 回路の総合結果判定（○ / × / -）
 */
export function evaluateOverallResult(c: CircuitItem): string {
  if (c.isExcluded) return '-'
  const p1 = isPhase1Complete(c)
  const p2 = isPhase2Complete(c)
  const p3 = isPhase3Complete(c)

  return p1 && p2 && p3 ? '○' : '×'
}

/**
 * 宣言的タグリゾルバマップ（オブジェクト生成を行わずキーから直接値を取得）
 */
export const DETAIL_RESOLVERS: Record<string, (c: CircuitItem) => string | number> = {
  回路番号: c => c.kairoBangou || '-',
  配電方式: c => c.haidenHoushiki || '-',
  ケーブルサイズ: c => c.cableList || '-',
  負荷名称: c => c.kairoMeisho || '-',
  サイズ確認: c => (c.p1Kakunin ? '✔' : ''),
  導通確認: c => (isPhase1Complete(c) ? '✔' : ''),
  締付_R: c => evaluateShimePhase(c, 'R'),
  締付_S: c => evaluateShimePhase(c, 'S'),
  締付_T: c => evaluateShimePhase(c, 'T'),
  締付_E: c => evaluateShimePhase(c, 'E'),
  締付確認: c => (c.p1Mashishime ? '✔' : ''),
  絶縁_R: c => c.zetsuenR ?? '-',
  絶縁_S: c => c.zetsuenS ?? '-',
  絶縁_T: c => c.zetsuenT ?? '-',
  絶縁判定: c => (c.p2IsComplete ? 'OK' : c.p2ConfirmedAt ? 'NG' : '-'),
  電圧_RS: c => c.denatsuRs ?? '-',
  電圧_ST: c => c.denatsuSt ?? '-',
  電圧_RT: c => c.denatsuRt ?? '-',
  検相: c => c.kensou || '-',
  総合結果: evaluateOverallResult,
}

/**
 * 行の書式をコピー
 */
function copyRowStyle(sourceRow: ExcelJS.Row, targetRow: ExcelJS.Row) {
  if (sourceRow.height) targetRow.height = sourceRow.height

  sourceRow.eachCell({ includeEmpty: true }, (sourceCell, colNumber) => {
    const targetCell = targetRow.getCell(colNumber)

    if (sourceCell.style) {
      targetCell.style = Object.assign({}, sourceCell.style)
      if (sourceCell.font) targetCell.font = Object.assign({}, sourceCell.font)
      if (sourceCell.border) targetCell.border = Object.assign({}, sourceCell.border)
      if (sourceCell.fill) targetCell.fill = Object.assign({}, sourceCell.fill)
      if (sourceCell.alignment) targetCell.alignment = Object.assign({}, sourceCell.alignment)
      if (sourceCell.numFmt) targetCell.numFmt = sourceCell.numFmt
    }
  })
}

/**
 * 単一盤の試験結果をテンプレートExcelへ差し込んでバッファを出力
 */
export async function generateExamReportExcel(options: ExamReportOptions): Promise<ExamReportResult> {
  const {
    templateBuffer,
    banMeisho,
    circuits,
    symbolSize = 28,
  } = options

  // 対象盤の回路のみを抽出
  const banCircuits = circuits.filter(c => c.banMeisho === banMeisho)

  // 回路番号順（自然順）にソート
  banCircuits.sort((a, b) => {
    const numA = parseInt(String(a.kairoBangou || '').replace(/\D/g, ''), 10) || 0
    const numB = parseInt(String(b.kairoBangou || '').replace(/\D/g, ''), 10) || 0

    return numA - numB
  })

  const workbook = new ExcelJS.Workbook()

  await workbook.xlsx.load(templateBuffer as unknown as ExcelJS.Buffer)

  // 対象シートの決定（盤名称と同名のシートがあれば優先、なければ第1シート）
  let sheet = workbook.getWorksheet(banMeisho)

  if (!sheet) {
    sheet = workbook.worksheets[0]
  }

  if (!sheet) {
    throw new Error('テンプレートに有効なワークシートが見つかりません')
  }

  // 1. ヘッダー共通情報の算出
  const examDateStr = calculateExamDateRange(banCircuits)
  const workersStr = calculateExamWorkers(banCircuits)

  const megger = options.devices?.megger
  const voltmeter = options.devices?.voltmeter
  const phaseDetector = options.devices?.phaseDetector

  const headerReplacements: Record<string, string> = {
    盤名称: banMeisho,
    試験日: examDateStr,
    測定者: workersStr,
    絶縁計_製造者: megger?.maker || '',
    絶縁計_型式: megger?.model || '',
    絶縁計_校正日: megger?.calibrationDate || '',
    絶縁計_製造番号: megger?.serialNumber || '',
    電圧計_製造者: voltmeter?.maker || '',
    電圧計_型式: voltmeter?.model || '',
    電圧計_校正日: voltmeter?.calibrationDate || '',
    電圧計_製造番号: voltmeter?.serialNumber || '',
    検相器_製造者: phaseDetector?.maker || '',
    検相器_型式: phaseDetector?.model || '',
    検相器_校正日: phaseDetector?.calibrationDate || '',
    検相器_製造番号: phaseDetector?.serialNumber || '',
  }

  // 2. シート全体から明細テンプレート行を探す
  let detailRowNumber: number | null = null
  const colTagMap = new Map<number, string>()

  sheet.eachRow((row, rowNumber) => {
    let hasDetailTagInThisRow = false

    row.eachCell({ includeEmpty: true }, (cell, _colNumber) => {
      const cellVal = cell.value != null ? String(cell.value).trim() : ''

      if (!cellVal) return

      // ヘッダータグの正規表現置換（%盤名称% など）
      if (cellVal.includes('%')) {
        const replaced = cellVal.replace(/%([^%]+)%/g, (match, tagKey) => {
          return headerReplacements[tagKey] !== undefined ? headerReplacements[tagKey]! : match
        })

        if (replaced !== cellVal) {
          cell.value = replaced
        }
      }

      // 明細タグが含まれているかの判定（DETAIL_RESOLVERS または 回路記号）
      if (detailRowNumber === null && cellVal.includes('%')) {
        const matches = cellVal.match(/%([^%]+)%/g)

        if (matches) {
          for (const m of matches) {
            const key = m.slice(1, -1)

            if (DETAIL_RESOLVERS[key] || key === '回路記号') {
              hasDetailTagInThisRow = true
              break
            }
          }
        }
      }
    })

    if (hasDetailTagInThisRow && detailRowNumber === null) {
      detailRowNumber = rowNumber
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const str = cell.value != null ? String(cell.value).trim() : ''

        if (str && str.includes('%')) {
          colTagMap.set(colNumber, str)
        }
      })
    }
  })

  // 3. 明細行のループ展開
  if (detailRowNumber !== null && colTagMap.size > 0 && banCircuits.length > 0) {
    const templateRow = sheet.getRow(detailRowNumber)

    for (let i = 0; i < banCircuits.length; i++) {
      const c = banCircuits[i]!
      const currentRowNumber = detailRowNumber + i
      let targetRow: ExcelJS.Row

      if (i === 0) {
        targetRow = templateRow
      }
      else {
        targetRow = sheet.getRow(currentRowNumber)
        copyRowStyle(templateRow, targetRow)
      }

      // 各列のタグを評価して値をセット
      colTagMap.forEach((tagTemplate, colNumber) => {
        const cell = targetRow.getCell(colNumber)

        // 回路記号画像
        if (tagTemplate.includes('%回路記号%')) {
          cell.value = ''
          const pngBase64 = generateCircuitSymbolPng(c.kairoKigou, symbolSize)

          if (pngBase64) {
            const imageId = workbook.addImage({
              base64: pngBase64,
              extension: 'png',
            })

            sheet.addImage(imageId, {
              tl: { col: colNumber - 1 + 0.1, row: currentRowNumber - 1 + 0.1 },
              ext: { width: symbolSize, height: symbolSize },
            })
          }

          return
        }

        // 単一タグまたは複合タグの正規表現置換
        let resolvedValue: string | number

        const singleMatch = tagTemplate.match(/^%([^%]+)%$/)

        if (singleMatch && singleMatch[1] && DETAIL_RESOLVERS[singleMatch[1]]) {
          // 単一タグなら型（数値等）を維持
          resolvedValue = DETAIL_RESOLVERS[singleMatch[1]]!(c)
        }
        else {
          resolvedValue = tagTemplate.replace(/%([^%]+)%/g, (match, tagKey) => {
            const resolver = DETAIL_RESOLVERS[tagKey]

            return resolver ? String(resolver(c)) : match
          })
        }

        cell.value = resolvedValue

        if (typeof resolvedValue === 'string' && resolvedValue.includes('\n')) {
          cell.alignment = Object.assign({}, cell.alignment, { wrapText: true })
        }
      })
    }
  }

  // 4. バッファ書き出し（マクロを含む .xlsm も構造を維持）
  const uint8 = await workbook.xlsx.writeBuffer()
  const isXlsm = Boolean(options.isXlsm)
  const ext = isXlsm ? 'xlsm' : 'xlsx'
  const safeBanName = banMeisho.replace(/[\\/:*?"<>|]/g, '_')
  const filename = `${safeBanName}_送電試験結果.${ext}`

  return {
    buffer: new Uint8Array(uint8),
    filename,
    circuitsCount: banCircuits.length,
  }
}

/**
 * 複数盤の試験結果を個別のExcelとして生成し、1つのZIPファイルにまとめて出力
 */
export async function generateExamReportsZip(options: ExamReportZipOptions): Promise<{
  buffer: Uint8Array
  filename: string
  totalCircuits: number
}> {
  const {
    templateBuffer,
    banMeishoList,
    circuits,
    symbolSize = 28,
    isXlsm = false,
    siteName = '現場',
  } = options

  const zip = new JSZip()
  let totalCircuits = 0

  for (const banMeisho of banMeishoList) {
    const report = await generateExamReportExcel({
      templateBuffer,
      banMeisho,
      circuits,
      symbolSize,
      isXlsm,
      devices: options.devices,
    })

    zip.file(report.filename, report.buffer)
    totalCircuits += report.circuitsCount
  }

  const zipContent = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  const safeSiteName = siteName.replace(/[\\/:*?"<>|]/g, '_')
  const filename = `${safeSiteName}_送電試験結果_${banMeishoList.length}盤.zip`

  return {
    buffer: zipContent,
    filename,
    totalCircuits,
  }
}
