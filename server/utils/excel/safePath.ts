/**
 * Excelファイルパス安全性検証ユーティリティ
 *
 * パストラバーサル防止、制御文字・システムディレクトリへのアクセス制限および拡張子検証を提供します。
 */

import fs from 'node:fs'
import path from 'node:path'

/**
 * Excelファイルパスの安全性を検証する (パストラバーサル・任意ファイル上書き防止)
 */
export function validateSafeExcelPath(rawPath: string): string {
  if (!rawPath || typeof rawPath !== 'string') {
    throw new Error('ファイルパスが指定されていません')
  }

  const cleaned = rawPath.trim().replace(/^["']+|["']+$/g, '').trim()

  if (!cleaned) {
    throw new Error('ファイルパスが空です')
  }

  // 拡張子チェック (.xlsx または .xlsm のみ許可)
  const ext = path.extname(cleaned).toLowerCase()

  if (ext !== '.xlsx' && ext !== '.xlsm') {
    throw new Error('Excelファイル形式（.xlsx または .xlsm）のみ指定可能です')
  }

  // パストラバーサル (..) の禁止
  if (cleaned.includes('..')) {
    throw new Error('パストラバーサル（..）を含むファイルパスは指定できません')
  }

  // Windows / UNIX の禁止文字・制御文字チェック
  const hasInvalidChars = /[*?"<>|]/.test(cleaned) || cleaned.split('').some(c => c.charCodeAt(0) < 32)

  if (hasInvalidChars) {
    throw new Error('ファイルパスに使用できない無効な文字が含まれています')
  }

  const normalized = path.normalize(cleaned)
  const normalizedLower = normalized.toLowerCase()

  // 機密ディレクトリやシステムフォルダへのアクセス禁止
  const forbiddenSegments = [
    '\\.git',
    '/\\.git',
    '\\node_modules',
    '/node_modules',
    '\\.env',
    '/\\.env',
    '\\prisma',
    '/prisma',
    '\\server',
    '/server',
    '\\windows',
    '\\system32',
    '/etc',
    '/usr',
    '/bin',
    '/sbin',
  ]

  for (const seg of forbiddenSegments) {
    if (normalizedLower.includes(seg)) {
      throw new Error(`セキュリティ上の理由から、指定されたパスへのアクセスは許可されていません: ${seg}`)
    }
  }

  return normalized
}

/**
 * 安全性を検証した上で、実在するExcelファイルパスを解決する。
 * （.xlsx で登録されているが実体が .xlsm の場合、またはその逆の拡張子ブレを自動フォールバック）
 */
export function resolveExistingExcelPath(rawPath: string): string {
  const safePath = validateSafeExcelPath(rawPath)

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
