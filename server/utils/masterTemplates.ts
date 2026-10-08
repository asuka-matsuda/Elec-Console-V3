/**
 * マスター帳票テンプレート管理ユーティリティ
 *
 * @description システムマスターで管理される複数の帳票ひな形Excelファイルの永続化ストレージと
 * メタデータ・現場割り当て管理を提供します。
 */

import fs from 'node:fs'
import path from 'node:path'

import type {
  MasterReportTemplateItem,
  ReportLogicType,
  ReportTemplateRegisteredFile,
} from '#shared/types/reportTemplate'

const MASTER_TEMPLATES_DIR = path.resolve(process.cwd(), '.data', 'master-templates')
const ITEMS_METADATA_FILE = path.resolve(MASTER_TEMPLATES_DIR, 'items.json')

function getMasterTemplatesDir(): string {
  if (!fs.existsSync(MASTER_TEMPLATES_DIR)) {
    fs.mkdirSync(MASTER_TEMPLATES_DIR, { recursive: true })
  }

  return MASTER_TEMPLATES_DIR
}

interface StoredItemsMetadata {
  items: MasterReportTemplateItem[]
}

function readItemsMetadata(): StoredItemsMetadata {
  getMasterTemplatesDir()
  if (!fs.existsSync(ITEMS_METADATA_FILE)) {
    return { items: [] }
  }

  try {
    const raw = fs.readFileSync(ITEMS_METADATA_FILE, 'utf-8')
    const parsed = JSON.parse(raw)

    return Array.isArray(parsed?.items) ? parsed : { items: [] }
  }
  catch {
    return { items: [] }
  }
}

function writeItemsMetadata(data: StoredItemsMetadata): void {
  getMasterTemplatesDir()
  fs.writeFileSync(ITEMS_METADATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

/**
 * 登録済み帳票テンプレート一覧を取得
 * @param siteId 指定された場合、その現場に割り当てられたテンプレート（全現場対象または対象現場に含まれるもの）のみを抽出
 */
export function getAllMasterTemplateItems(siteId?: string): MasterReportTemplateItem[] {
  const meta = readItemsMetadata()

  // 実在ファイルが存在するもののみに絞り込み

  const validItems = meta.items.filter((item) => {
    const p = getMasterTemplateItemFilePath(item.id)

    return p && fs.existsSync(p)
  })

  if (!siteId) {
    return validItems
  }

  // 現場フィルター
  return validItems.filter(item => item.isAllSites || (item.assignedSiteIds && item.assignedSiteIds.includes(siteId)))
}

/**
 * 単一の帳票テンプレート情報を取得
 */
export function getMasterTemplateItem(id: string): MasterReportTemplateItem | null {
  const meta = readItemsMetadata()
  const found = meta.items.find(item => item.id === id)

  if (!found) return null

  const filePath = getMasterTemplateItemFilePath(id)

  if (!filePath || !fs.existsSync(filePath)) {
    return null
  }

  return found
}

function isValidTemplateId(id: string): boolean {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]+$/.test(id)
}

/**
 * テンプレート実体ファイルパスを取得
 */
export function getMasterTemplateItemFilePath(id: string): string | null {
  if (!isValidTemplateId(id)) {
    return null
  }

  const dir = getMasterTemplatesDir()
  const exts = ['.xlsx', '.xlsm', '.xls']

  for (const ext of exts) {
    const p = path.resolve(dir, `${id}${ext}`)

    // 安全確認: 解決パスが必ず dir 直下に収まっていることを検証
    if (path.dirname(p) === dir && fs.existsSync(p)) {
      return p
    }
  }

  return null
}

/**
 * 帳票テンプレートの新規登録または更新
 */
export async function saveMasterTemplateItem(params: {
  id?: string
  name: string
  logicType: ReportLogicType
  logicFile?: string
  description?: string
  isAllSites?: boolean
  assignedSiteIds?: string[]
  fileBuffer?: Buffer
  originalFilename?: string
}): Promise<MasterReportTemplateItem> {
  const dir = getMasterTemplatesDir()
  const meta = readItemsMetadata()

  if (params.id && !isValidTemplateId(params.id)) {
    throw new Error('無効なテンプレートIDです。半角英数字、ハイフン、アンダースコアのみ使用できます。')
  }

  const id = params.id || `tpl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  const now = new Date().toISOString()

  let fileInfo: ReportTemplateRegisteredFile

  // ファイルがアップロードされている場合
  if (params.fileBuffer && params.originalFilename) {
    const rawBaseFilename = path.basename(params.originalFilename).replace(/[\\/:*?"<>|]/g, '_')
    const rawExt = path.extname(rawBaseFilename).toLowerCase() || '.xlsx'

    // 既存ファイルの削除
    const oldPath = getMasterTemplateItemFilePath(id)

    if (oldPath && fs.existsSync(oldPath)) {
      await fs.promises.unlink(oldPath)
    }

    const targetPath = path.resolve(dir, `${id}${rawExt}`)

    // ディレクトリトラバーサル防止ガード
    if (path.dirname(targetPath) !== dir) {
      throw new Error('不正なファイル保存先パスが検出されました。')
    }

    await fs.promises.writeFile(targetPath, params.fileBuffer)

    const stat = await fs.promises.stat(targetPath)

    fileInfo = {
      filename: rawBaseFilename,
      size: stat.size,
      updatedAt: stat.mtime.toISOString(),
    }
  }
  else {
    // 既存アイテムのファイル情報を維持
    const existing = meta.items.find(item => item.id === id)

    if (!existing) {
      throw new Error('ひな形Excelファイルが指定されていません。')
    }
    fileInfo = existing.file
  }

  const existingIndex = meta.items.findIndex(item => item.id === id)
  const isAllSites = params.isAllSites !== undefined ? Boolean(params.isAllSites) : true
  const assignedSiteIds = Array.isArray(params.assignedSiteIds) ? params.assignedSiteIds : []

  const item: MasterReportTemplateItem = {
    id,
    name: params.name.trim(),
    logicType: params.logicType,
    logicFile: params.logicFile ? params.logicFile.trim() : undefined,
    description: (params.description || '').trim(),
    file: fileInfo,
    isAllSites,
    assignedSiteIds,
    createdAt: existingIndex >= 0 && meta.items[existingIndex] ? meta.items[existingIndex].createdAt : now,
    updatedAt: now,
  }

  if (existingIndex >= 0) {
    meta.items[existingIndex] = item
  }
  else {
    meta.items.push(item)
  }

  writeItemsMetadata(meta)

  return item
}

/**
 * 帳票テンプレートの削除
 */
export async function deleteMasterTemplateItem(id: string): Promise<boolean> {
  if (!isValidTemplateId(id)) {
    return false
  }

  const filePath = getMasterTemplateItemFilePath(id)

  if (filePath && fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath)
  }

  const meta = readItemsMetadata()
  const initialLen = meta.items.length

  meta.items = meta.items.filter(item => item.id !== id)

  if (meta.items.length !== initialLen) {
    writeItemsMetadata(meta)

    return true
  }

  return false
}

// --- 旧互換関数（テストや既存呼び出しの保護） ---
export function getAllMasterTemplatesMeta(): Record<string, ReportTemplateRegisteredFile> {
  const items = getAllMasterTemplateItems()
  const result: Record<string, ReportTemplateRegisteredFile> = {}

  for (const item of items) {
    result[item.id] = item.file
  }

  return result
}

export function getMasterTemplateFilePath(id: string): string | null {
  return getMasterTemplateItemFilePath(id)
}

export async function saveMasterTemplate(
  id: string,
  fileBuffer: Buffer,
  originalFilename: string,
): Promise<ReportTemplateRegisteredFile> {
  const item = await saveMasterTemplateItem({
    id,
    name: id,
    logicType: (['tag', 'socket-tepra', 'exam', 'remote'].includes(id) ? id : 'tag') as ReportLogicType,
    fileBuffer,
    originalFilename,
    isAllSites: true,
  })

  return item.file
}

export async function deleteMasterTemplate(id: string): Promise<boolean> {
  return deleteMasterTemplateItem(id)
}
