/**
 * リモコン設定表 Excel 帳票生成エンジン
 *
 * @description 回路台帳から抽出されたアドレスデータ（0-1〜63-4）を、
 * 原本テンプレート（リモコン設定表）へ流し込みます。
 *
 * 【原本完全保護 Direct Template Engine】
 * ExcelJS による再生成や後付け ZIP パッチを行わず、原本の OOXML / ZIP パッケージを
 * 直接開いてデータセルと回路記号のみを規格完全準拠で注入します。
 * これにより、印刷範囲（$A$1:$I$308）、44行ごとの手動改ページ、拡大縮小率、
 * 条件付き書式（DXF）、および原本に存在する直線コネクタ図形を 100% 無傷で保護します。
 */
import JSZip from 'jszip'

import type {
  RemoteCircuitItem,
  RemoteControlConfig,
  RemoteExportTarget,
  RemoteGroupSummary,
  RemotePatternSummary,
} from '#shared/types/remoteControl'
import { generateCircuitSymbolPng } from '~/utils/circuitSymbolImage'
import { getExcelJS } from '~/utils/excelHelper'

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
      addressText: addrs.join('  '),
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

interface RemoteSymbolOptions {
  enabled?: boolean
  width?: number
  height?: number
}

interface GenerateRemoteReportOptions {
  templateBuffer?: ArrayBuffer | Uint8Array | null
  circuits: RemoteCircuitItem[]
  config: RemoteControlConfig
  siteName?: string
  exportTarget?: RemoteExportTarget
  selectedDenso?: string
  symbolOptions?: RemoteSymbolOptions
}

interface RemoteReportResult {
  buffer: Uint8Array
  filename: string
  totalAddresses: number
  configuredGroups: number
  configuredPatterns: number
}

/**
 * リモコン設定表 Excel 帳票を生成（Direct Template Engine 方式）
 */
export async function generateRemoteReportExcel(
  options: GenerateRemoteReportOptions,
): Promise<RemoteReportResult> {
  const { templateBuffer, circuits, config, siteName = '', selectedDenso, symbolOptions } = options

  const configuredGroups = Object.values(config.assignments).filter(a => a.groups && a.groups.length > 0).length
  const configuredPatterns = Object.values(config.assignments).filter(a => a.patterns && a.patterns.length > 0).length

  // 伝送系統フィルタの適用とアドレスマップの構築（fukaAddress: '0-1', '0-2', ...）
  const filteredCircuits = selectedDenso
    ? circuits.filter(c => !c.densoKeiTo || c.densoKeiTo === selectedDenso)
    : circuits

  const circuitMap = new Map<string, RemoteCircuitItem>()

  filteredCircuits.forEach((c) => {
    if (c.fukaAddress) {
      circuitMap.set(c.fukaAddress.trim(), c)
    }
  })

  // 1. テンプレートが存在する場合は Direct ZIP/XML Engine で原本を完全保護して直接書き込む
  if (templateBuffer) {
    const zip = await JSZip.loadAsync(templateBuffer)

    // sharedStrings.xml の読み込み（A列のアドレスが共有文字列 t="s" の場合に対応）
    const sharedStrings: string[] = []
    const sharedStringsXml = await zip.file('xl/sharedStrings.xml')?.async('string')

    if (sharedStringsXml) {
      const siMatches = sharedStringsXml.matchAll(/<si>([\s\S]*?)<\/si>/g)

      for (const siMatch of siMatches) {
        const textParts: string[] = []
        const tMatches = (siMatch[1] || '').matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)

        for (const tm of tMatches) {
          textParts.push(tm[1] || '')
        }
        sharedStrings.push(textParts.join('').trim())
      }
    }

    // 対象のワークシート XML を特定（sheet1.xml 等）
    let sheetPath = 'xl/worksheets/sheet1.xml'
    const sheetFiles = Object.keys(zip.files).filter(k => /^xl\/worksheets\/sheet\d+\.xml$/.test(k))

    if (sheetFiles.length > 0 && !zip.file(sheetPath)) {
      sheetPath = sheetFiles[0]!
    }

    let sheetXml = await zip.file(sheetPath)?.async('string')

    if (!sheetXml) {
      throw new Error('テンプレート内に有効なワークシートXMLが見つかりません')
    }

    const symbolRows: Array<{ r: number, kigou: string }> = []

    // 行 5〜308（アドレス 0-1 〜 63-4 の計 256 回路）を直接走査・置換
    sheetXml = sheetXml.replace(/<row[^>]*r="(\d+)"[\s\S]*?<\/row>/g, (rowStr, rStr) => {
      const r = parseInt(rStr, 10)

      if (r < 5 || r > 308) return rowStr

      // A列のセルからアドレスを探す（インライン文字列 <t> または共有文字列 t="s" <v>）
      const aCellMatch = rowStr.match(/<c r="A\d+"([^>]*)>([\s\S]*?)<\/c>/)
      let addrFromCell = ''

      if (aCellMatch) {
        const cAttrs = aCellMatch[1] || ''
        const cBody = aCellMatch[2] || ''
        const tMatch = cBody.match(/<t[^>]*>([^<]+)<\/t>/)

        if (tMatch && tMatch[1]) {
          addrFromCell = tMatch[1].trim()
        }
        else if (/\bt="s"/.test(cAttrs)) {
          const vMatch = cBody.match(/<v>(\d+)<\/v>/)

          if (vMatch && vMatch[1]) {
            const sstIdx = parseInt(vMatch[1], 10)

            addrFromCell = sharedStrings[sstIdx] || ''
          }
        }
      }

      const offset = r - 5
      const primary = Math.floor(offset / 4)
      const secondary = (offset % 4) + 1
      const calculatedAddr = `${primary}-${secondary}`
      const addr = addrFromCell && /^\d+-\d+$/.test(addrFromCell) ? addrFromCell : calculatedAddr

      const c = circuitMap.get(addr)

      let banVal = ''
      let bangouVal = ''
      let relayVal = ''
      let meishoVal = ''
      let dousaVal = ''

      if (c) {
        banVal = c.banMeisho || ''

        if (c.isVacant && !c.kairoBangou) {
          // T/U余りスロット（盤名はあるが回路未割り当て）
          bangouVal = '-'
          relayVal = '-'
          meishoVal = '-'
          dousaVal = '-'
        }
        else {
          bangouVal = c.kairoBangou || ''
          relayVal = c.relayNumber || ''
          // 回路名称の改行を半角スペースに正規化
          meishoVal = c.kairoMeisho
            ? c.kairoMeisho.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim()
            : ''
          // 動作良否: 入力行は「良」、回路番号が「-」なら「-」
          dousaVal = bangouVal === '-' ? '-' : (bangouVal ? '良' : '')

          if (symbolOptions?.enabled !== false && c.kairoKigou && bangouVal && bangouVal !== '-') {
            symbolRows.push({ r, kigou: c.kairoKigou.trim() })
          }
        }
      }

      rowStr = updateXmlCell(rowStr, `C${r}`, banVal)
      rowStr = updateXmlCell(rowStr, `D${r}`, bangouVal)
      rowStr = updateXmlCell(rowStr, `E${r}`, relayVal)
      rowStr = updateXmlCell(rowStr, `F${r}`, meishoVal)
      rowStr = updateXmlCell(rowStr, `H${r}`, dousaVal)

      return rowStr
    })

    zip.file(sheetPath, sheetXml)

    // 回路記号画像（PNG）の注入（既存の図形 ID と衝突しないよう一意に採番）
    if (symbolRows.length > 0) {
      await injectCircuitSymbolsIntoZip(zip, symbolRows, symbolOptions)
    }

    const outBuffer = await zip.generateAsync({ type: 'uint8array' })
    const filename = `${siteName ? `${siteName}_` : ''}リモコン設定表.xlsx`

    return {
      buffer: outBuffer,
      filename,
      totalAddresses: circuitMap.size,
      configuredGroups,
      configuredPatterns,
    }
  }

  // 2. テンプレート未指定時（単体テスト等）の生成
  return generateWorkbookFallback({
    circuits: filteredCircuits,
    config,
    siteName,
    configuredGroups,
    configuredPatterns,
  })
}

/**
 * OOXML の row XML 内の指定セル（r="C5" 等）の値をインライン文字列または空セルに安全に更新
 */
function updateXmlCell(rowXml: string, cellRef: string, text: string): string {
  const cellRegex = new RegExp(`<c r="${cellRef}"([^>]*)>([\\s\\S]*?)<\\/c>|<c r="${cellRef}"([^>]*)\\/>`)
  const match = rowXml.match(cellRegex)

  if (!match) return rowXml

  // 既存のスタイル属性 (s="...") を温存
  const attrStr = match[1] || match[3] || ''
  const styleMatch = attrStr.match(/s="(\d+)"/)
  const styleAttr = styleMatch ? ` s="${styleMatch[1]}"` : ''

  if (!text) {
    return rowXml.replace(
      cellRegex,
      `<c r="${cellRef}"${styleAttr} t="inlineStr"><is><t xml:space="preserve"></t></is></c>`,
    )
  }

  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  return rowXml.replace(
    cellRegex,
    `<c r="${cellRef}"${styleAttr} t="inlineStr"><is><t xml:space="preserve">${escapedText}</t></is></c>`,
  )
}

const TRANSPARENT_1X1_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

/**
 * ZIP 内の drawing1.xml に回路記号（Canvas PNG）を安全に注入
 */
async function injectCircuitSymbolsIntoZip(
  zip: JSZip,
  symbolRows: Array<{ r: number, kigou: string }>,
  symbolOptions?: RemoteSymbolOptions,
): Promise<void> {
  let drawingXml = (await zip.file('xl/drawings/drawing1.xml')?.async('string')) || ''

  if (!drawingXml) {
    drawingXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"></xdr:wsDr>'
  }

  // 既存の図形 ID を走査し、最大 ID を取得（原本の斜線図形 id=38, 39 との衝突を完全に防止）
  let maxId = 0
  const idMatches = drawingXml.matchAll(/<xdr:cNvPr[^>]*\sid="(\d+)"/g)

  for (const m of idMatches) {
    const idNum = parseInt(m[1] || '0', 10)

    if (idNum > maxId) maxId = idNum
  }

  const relsPath = 'xl/drawings/_rels/drawing1.xml.rels'
  let relsXml = (await zip.file(relsPath)?.async('string')) || ''

  if (!relsXml) {
    relsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n</Relationships>'
  }

  let nextRelId = 1
  const existingRIds = relsXml.matchAll(/Id="rId(\d+)"/g)

  for (const m of existingRIds) {
    const rNum = parseInt(m[1] || '0', 10)

    if (rNum >= nextRelId) nextRelId = rNum + 1
  }

  const symWidthPx = symbolOptions?.width && symbolOptions.width > 0 ? symbolOptions.width : 24
  const symHeightPx = symbolOptions?.height && symbolOptions.height > 0 ? symbolOptions.height : 24
  const cxEmu = Math.round(symWidthPx * 9525)
  const cyEmu = Math.round(symHeightPx * 9525)

  const symbolImageRelMap = new Map<string, string>()
  const newAnchors: string[] = []

  for (const { r, kigou } of symbolRows) {
    if (!symbolImageRelMap.has(kigou)) {
      const pngDataUrl = generateCircuitSymbolPng(kigou, {
        width: Math.max(32, symWidthPx),
        height: Math.max(24, symHeightPx),
      })
      const base64Data = pngDataUrl
        ? pngDataUrl.replace(/^data:image\/png;base64,/, '')
        : TRANSPARENT_1X1_PNG_BASE64
      const sanitizedKigou = kigou.replace(/[^a-zA-Z0-9_-]/g, '_')
      const mediaName = `symbol_${sanitizedKigou}.png`
      const mediaPath = `xl/media/${mediaName}`

      zip.file(mediaPath, base64Data, { base64: true })

      const rId = `rId_sym_${nextRelId++}`
      const newRel = `  <Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${mediaName}"/>`

      relsXml = relsXml.replace('</Relationships>', `${newRel}\n</Relationships>`)
      symbolImageRelMap.set(kigou, rId)
    }

    const rId = symbolImageRelMap.get(kigou)!
    const shapeId = ++maxId

    // D列（col=3）、該当行（r-1）に指定サイズ（EMU）で配置
    // ECMA-376 規格に完全準拠（editAs なし）
    const anchorXml = `  <xdr:oneCellAnchor>
    <xdr:from>
      <xdr:col>3</xdr:col>
      <xdr:colOff>60000</xdr:colOff>
      <xdr:row>${r - 1}</xdr:row>
      <xdr:rowOff>10000</xdr:rowOff>
    </xdr:from>
    <xdr:ext cx="${cxEmu}" cy="${cyEmu}"/>
    <xdr:pic>
      <xdr:nvPicPr>
        <xdr:cNvPr id="${shapeId}" name="Symbol ${kigou}"/>
        <xdr:cNvPicPr>
          <a:picLocks noChangeAspect="1"/>
        </xdr:cNvPicPr>
      </xdr:nvPicPr>
      <xdr:blipFill>
        <a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="${rId}"/>
        <a:stretch><a:fillRect/></a:stretch>
      </xdr:blipFill>
      <xdr:spPr>
        <a:xfrm><a:off x="0" y="0"/><a:ext cx="${cxEmu}" cy="${cyEmu}"/></a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
      </xdr:spPr>
    </xdr:pic>
    <xdr:clientData/>
  </xdr:oneCellAnchor>`

    newAnchors.push(anchorXml)
  }

  if (newAnchors.length > 0) {
    drawingXml = drawingXml.replace('</xdr:wsDr>', `${newAnchors.join('\n')}\n</xdr:wsDr>`)
    zip.file('xl/drawings/drawing1.xml', drawingXml)
    zip.file(relsPath, relsXml)

    let contentTypesXml = (await zip.file('[Content_Types].xml')?.async('string')) || ''

    if (!contentTypesXml.includes('Extension="png"')) {
      contentTypesXml = contentTypesXml.replace(
        '</Types>',
        '  <Default Extension="png" ContentType="image/png"/>\n</Types>',
      )
      zip.file('[Content_Types].xml', contentTypesXml)
    }
  }
}

/**
 * テンプレートなし（またはテスト環境）用の最小フォールバック生成
 */
async function generateWorkbookFallback(context: {
  circuits: RemoteCircuitItem[]
  config: RemoteControlConfig
  siteName: string
  configuredGroups: number
  configuredPatterns: number
}): Promise<RemoteReportResult> {
  const ExcelJS = await getExcelJS()
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('アドレス設定表')

  sheet.getRow(4).values = ['アドレス番号', '', '盤名称', '回路番号', 'リレー番号', '負荷名称', '', '動作確認']

  context.circuits.forEach((c, idx) => {
    const rowNum = 5 + idx
    const isTuSpare = c.isVacant && !c.kairoBangou
    const bangou = isTuSpare ? '-' : (c.kairoBangou || '')
    const relay = isTuSpare ? '-' : (c.relayNumber || '')
    const meisho = isTuSpare ? '-' : (c.kairoMeisho ? c.kairoMeisho.replace(/[\r\n]+/g, ' ').trim() : '')
    const dousa = bangou === '-' ? '-' : (bangou ? '良' : '')

    sheet.getRow(rowNum).values = [
      c.fukaAddress || '',
      '',
      c.banMeisho || '',
      bangou,
      relay,
      meisho,
      '',
      dousa,
    ]
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const filename = `${context.siteName ? `${context.siteName}_` : ''}リモコン設定表.xlsx`

  return {
    buffer: new Uint8Array(buffer),
    filename,
    totalAddresses: context.circuits.length,
    configuredGroups: context.configuredGroups,
    configuredPatterns: context.configuredPatterns,
  }
}
