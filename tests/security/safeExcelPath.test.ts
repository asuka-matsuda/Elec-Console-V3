import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { resolveExistingExcelPath, validateSafeExcelPath } from '../../server/utils/excel/safePath'

describe('Safe Excel File Path Validation (Path Traversal & Overwrite Protection)', () => {
  it('should accept valid Excel file paths inside .data/templates', () => {
    const validPath1 = path.join(process.cwd(), '.data', 'templates', 'circuits.xlsx')
    const validPath2 = path.join('.data', 'templates', 'test_site.xlsm')

    expect(() => validateSafeExcelPath(validPath1)).not.toThrow()
    expect(() => validateSafeExcelPath(validPath2)).not.toThrow()
  })

  it('should enforce siteId directory boundary when siteId is provided', () => {
    const validSitePath = path.join('.data', 'templates', 'site-01', 'circuits.xlsx')
    const otherSitePath = path.join('.data', 'templates', 'site-02', 'circuits.xlsx')
    const rootTemplatePath = path.join('.data', 'templates', 'circuits.xlsx')

    expect(() => validateSafeExcelPath(validSitePath, 'site-01')).not.toThrow()
    expect(() => validateSafeExcelPath(otherSitePath, 'site-01')).toThrow('他の現場のテンプレート領域へのアクセスは許可されていません')
    expect(() => validateSafeExcelPath(rootTemplatePath, 'site-01')).toThrow('他の現場のテンプレート領域へのアクセスは許可されていません')
  })

  it('resolveExistingExcelPath should reject empty or cross-site paths and resolve valid site paths', () => {
    const validSitePath = path.join('.data', 'templates', 'site-01', 'circuits.xlsx')
    const otherSitePath = path.join('.data', 'templates', 'site-02', 'circuits.xlsx')

    expect(() => resolveExistingExcelPath('', 'site-01')).toThrow('ファイルパスが指定されていません')
    expect(() => resolveExistingExcelPath(otherSitePath, 'site-01')).toThrow('他の現場のテンプレート領域へのアクセスは許可されていません')
    expect(resolveExistingExcelPath(validSitePath, 'site-01')).toBe(path.resolve(process.cwd(), validSitePath))
  })

  it('should reject arbitrary file paths outside .data/templates', () => {
    expect(() => validateSafeExcelPath('C:\\data\\circuits.xlsx')).toThrow('テンプレート保管領域（.data/templates）外')
    expect(() => validateSafeExcelPath('D:\\reports\\test_site.xlsm')).toThrow('テンプレート保管領域（.data/templates）外')
  })

  it('should reject empty or non-string file paths', () => {
    expect(() => validateSafeExcelPath('')).toThrow('ファイルパスが指定されていません')
    expect(() => validateSafeExcelPath('   ')).toThrow('ファイルパスが空です')
  })

  it('should reject non-Excel extensions', () => {
    expect(() => validateSafeExcelPath('.data/templates/test.exe')).toThrow('Excelファイル形式')
    expect(() => validateSafeExcelPath('.data/templates/test.php')).toThrow('Excelファイル形式')
    expect(() => validateSafeExcelPath('.data/templates/test.csv')).toThrow('Excelファイル形式')
    expect(() => validateSafeExcelPath('.data/templates/test.bat')).toThrow('Excelファイル形式')
  })

  it('should reject path traversal sequences (..)', () => {
    expect(() => validateSafeExcelPath('C:\\app\\..\\..\\Windows\\test.xlsx')).toThrow('パストラバーサル')
    expect(() => validateSafeExcelPath('../../../test.xlsx')).toThrow('パストラバーサル')
  })

  it('should reject forbidden directories and files', () => {
    expect(() => validateSafeExcelPath('C:\\app\\.git\\test.xlsx')).toThrow('セキュリティ上の理由')
    expect(() => validateSafeExcelPath('C:\\app\\node_modules\\test.xlsx')).toThrow('セキュリティ上の理由')
    expect(() => validateSafeExcelPath('C:\\app\\server\\test.xlsx')).toThrow('セキュリティ上の理由')
    expect(() => validateSafeExcelPath('C:\\app\\.env\\test.xlsx')).toThrow('セキュリティ上の理由')
    expect(() => validateSafeExcelPath('C:\\app\\prisma\\test.xlsx')).toThrow('セキュリティ上の理由')
    expect(() => validateSafeExcelPath('C:\\Windows\\System32\\test.xlsx')).toThrow('セキュリティ上の理由')
  })

  it('should reject invalid control or shell characters', () => {
    expect(() => validateSafeExcelPath('.data/templates/circuits<>.xlsx')).toThrow('無効な文字')
    expect(() => validateSafeExcelPath('.data/templates/circuits|test.xlsx')).toThrow('無効な文字')
  })

  it('should reject UNC network paths (SMB / NetNTLM hash theft protection)', () => {
    expect(() => validateSafeExcelPath('\\\\attacker.com\\share\\exploit.xlsx')).toThrow('ネットワーク共有パス')
    expect(() => validateSafeExcelPath('//192.168.1.100/shared/test.xlsx')).toThrow('ネットワーク共有パス')
    expect(() => validateSafeExcelPath('\\\\?\\C:\\data\\test.xlsx')).toThrow('ネットワーク共有パス')
    expect(() => validateSafeExcelPath('smb://attacker.com/share/test.xlsx')).toThrow('ネットワーク共有パス')
    expect(() => validateSafeExcelPath('http://attacker.com/test.xlsx')).toThrow('ネットワーク共有パス')
  })

  it('should reject null bytes and encoded path traversal', () => {
    expect(() => validateSafeExcelPath('C:\\data\\test.xlsx\0')).toThrow('不正な文字')
    expect(() => validateSafeExcelPath('C:\\data\\test%00.xlsx')).toThrow('不正な文字')
    expect(() => validateSafeExcelPath('C:\\data\\%2e%2e\\test.xlsx')).toThrow('不正な文字')
  })
})
