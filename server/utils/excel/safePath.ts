/**
 * Excelファイルパス安全性検証ユーティリティ
 *
 * パストラバーサル防止、制御文字・システムディレクトリへのアクセス制限および拡張子検証を提供します。
 */

import fs from 'node:fs'
import path from 'node:path'

/**
 * Excelファイルパスの安全性を検証する (パストラバーサル・任意ファイル上書き・UNCパス攻撃防止)
 */
export function validateSafeExcelPath(rawPath: string, siteId?: string): string {
  if (!rawPath || typeof rawPath !== 'string') {
    throw new Error('ファイルパスが指定されていません')
  }

  const cleaned = rawPath.trim().replace(/^["']+|["']+$/g, '').trim()

  if (!cleaned) {
    throw new Error('ファイルパスが空です')
  }

  // 1. ヌルバイト・URLエンコードパストラバーサルの禁止
  if (
    cleaned.includes('\0')
    || cleaned.includes('%00')
    || cleaned.toLowerCase().includes('%2e%2e')
  ) {
    throw new Error('ファイルパスに不正な文字が含まれています')
  }

  // 2. ネットワーク共有パス（UNCパス: \\, //）およびリモートURIの禁止（NetNTLM漏洩防止）
  if (
    cleaned.startsWith('\\\\')
    || cleaned.startsWith('//')
    || /^[\\/]{2,}/.test(cleaned)
    || /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(cleaned)
  ) {
    throw new Error('ネットワーク共有パス（UNCパス）やリモートURIへのアクセスは禁止されています')
  }

  // 3. 拡張子チェック (.xlsx または .xlsm のみ許可)
  const ext = path.extname(cleaned).toLowerCase()

  if (ext !== '.xlsx' && ext !== '.xlsm') {
    throw new Error('Excelファイル形式（.xlsx または .xlsm）のみ指定可能です')
  }

  // 4. パストラバーサル (..) の禁止
  if (cleaned.includes('..')) {
    throw new Error('パストラバーサル（..）を含むファイルパスは指定できません')
  }

  // 5. Windows / UNIX の禁止文字・制御文字チェック
  const hasInvalidChars = /[*?"<>|]/.test(cleaned) || cleaned.split('').some(c => c.charCodeAt(0) < 32)

  if (hasInvalidChars) {
    throw new Error('ファイルパスに使用できない無効な文字が含まれています')
  }

  const normalized = path.normalize(cleaned)
  // 6. サーバー管理領域（.data/templates）ホワイトリスト検証
  const allowedRoot = path.resolve(process.cwd(), '.data', 'templates')
  const safeSiteId = siteId && /^[a-zA-Z0-9_-]+$/.test(siteId) ? siteId : undefined
  const allowedDir = safeSiteId ? path.resolve(allowedRoot, safeSiteId) : allowedRoot

  const isInsideAllowed = (candidate: string): boolean => {
    const rel = path.relative(allowedDir, candidate)

    return Boolean(rel) && !rel.startsWith('..') && !path.isAbsolute(rel)
  }

  let resolved = path.resolve(process.cwd(), normalized)

  // 別環境（Windows ⇄ Linux 等）で保存された .data/templates 配下パスの自動正規化
  if (!isInsideAllowed(resolved)) {
    const markerMatch = normalized.replace(/\\/g, '/').match(/\.data\/templates\/(.+)$/i)

    if (markerMatch?.[1]) {
      const candidate = path.resolve(allowedRoot, markerMatch[1])

      if (isInsideAllowed(candidate)) {
        resolved = candidate
      }
    }
    else if (safeSiteId) {
      const candidateByBasename = path.resolve(allowedDir, path.basename(normalized))

      if (isInsideAllowed(candidateByBasename) && fs.existsSync(candidateByBasename)) {
        resolved = candidateByBasename
      }
    }
  }

  if (!isInsideAllowed(resolved)) {
    const relRoot = path.relative(allowedRoot, resolved)
    const isInsideRoot = Boolean(relRoot) && !relRoot.startsWith('..') && !path.isAbsolute(relRoot)

    if (safeSiteId && isInsideRoot) {
      throw new Error('セキュリティ上の理由から、他の現場のテンプレート領域へのアクセスは許可されていません')
    }

    throw new Error('セキュリティ上の理由から、テンプレート保管領域（.data/templates）外のファイルパスへのアクセスは許可されていません')
  }

  return resolved
}

/**
 * 安全性を検証した上で、実在するExcelファイルパスを解決する。
 * （.xlsx で登録されているが実体が .xlsm の場合、またはその逆の拡張子ブレを自動フォールバック）
 */
export function resolveExistingExcelPath(rawPath: string, siteId?: string): string {
  const safePath = validateSafeExcelPath(rawPath, siteId)

  // そのまま実在すればそれを採用
  if (fs.existsSync(safePath)) {
    return safePath
  }

  const ext = path.extname(safePath).toLowerCase()
  const altExt = ext === '.xlsx' ? '.xlsm' : '.xlsx'
  const altPath = safePath.slice(0, -ext.length) + altExt

  if (fs.existsSync(altPath)) {
    return altPath
  }

  return safePath
}
