import { describe, expect, it } from 'vitest'

import { validateSafeExcelPath } from '../../server/utils/excel/safePath'

describe('Safe Excel File Path Validation (Path Traversal & Overwrite Protection)', () => {
  it('should accept valid Excel file paths', () => {
    expect(() => validateSafeExcelPath('C:\\data\\circuits.xlsx')).not.toThrow()
    expect(() => validateSafeExcelPath('D:\\reports\\test_site.xlsm')).not.toThrow()
  })

  it('should reject empty or non-string file paths', () => {
    expect(() => validateSafeExcelPath('')).toThrow('ファイルパスが指定されていません')
    expect(() => validateSafeExcelPath('   ')).toThrow('ファイルパスが空です')
  })

  it('should reject non-Excel extensions', () => {
    expect(() => validateSafeExcelPath('C:\\test.exe')).toThrow('Excelファイル形式')
    expect(() => validateSafeExcelPath('C:\\test.php')).toThrow('Excelファイル形式')
    expect(() => validateSafeExcelPath('C:\\test.csv')).toThrow('Excelファイル形式')
    expect(() => validateSafeExcelPath('C:\\test.bat')).toThrow('Excelファイル形式')
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
    expect(() => validateSafeExcelPath('C:\\data\\circuits<>.xlsx')).toThrow('無効な文字')
    expect(() => validateSafeExcelPath('C:\\data\\circuits|test.xlsx')).toThrow('無効な文字')
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
