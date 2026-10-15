/**
 * 回路一覧Excelインポート API
 * POST /api/sites/:siteId/circuits/import
 *
 * @description アップロードされた回路表Excelファイルを解析し、現場の回路一覧として登録・同期します。
 * @permission 現場アクセス権限
 */

import fs from 'node:fs'
import path from 'node:path'

import { defineEventHandler, getHeader, getRouterParam, readBody, readMultipartFormData } from 'h3'

import { ErrorCode } from '#shared/types/errors'
import { sanitizeFilename } from '#shared/utils/filename'
import { getUserDisplayName } from '#shared/utils/user'

import { requireSiteAdmin } from '../../../../utils/auth'
import { createAppError } from '../../../../utils/error'
import { importCircuitsFromExcel } from '../../../../utils/excel/circuitImport'
import { validateSafeExcelPath } from '../../../../utils/excel/safePath'
import { prisma } from '../../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireSiteAdmin(event)

  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: '現場IDが指定されていません',
    })
  }

  const contentType = getHeader(event, 'content-type') || ''
  let uploadedFile: { data: Buffer, filename?: string } | null = null
  let mode: 'merge' | 'reset' = 'merge'
  let targetPath = ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await readMultipartFormData(event)

    if (formData) {
      for (const part of formData) {
        if (part.name === 'file' && part.data) {
          uploadedFile = { data: part.data, filename: part.filename }
        }
        else if (part.name === 'mode') {
          mode = part.data.toString() === 'reset' ? 'reset' : 'merge'
        }
        else if (part.name === 'filePath') {
          targetPath = part.data.toString().trim().replace(/^["']+|["']+$/g, '').trim()
        }
      }
    }
  }
  else {
    const body = (await readBody(event).catch(() => null)) as {
      filePath?: string
      mode?: 'merge' | 'reset'
    } | null

    targetPath = body?.filePath?.trim().replace(/^["']+|["']+$/g, '').trim() || ''
    mode = body?.mode === 'reset' ? 'reset' : 'merge'
  }

  if (!uploadedFile && !targetPath) {
    const settings = await prisma.siteSettings.findUnique({
      where: { siteId },
    })

    targetPath = settings?.excelPath?.trim().replace(/^["']+|["']+$/g, '').trim() || ''
  }

  if (!uploadedFile && !targetPath) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: 'Excelファイルが選択されていないか、連携ファイルの保存先パスが設定されていません。',
    })
  }

  // アップロードファイルの安全性検証（サイズ制限・マジックナンバー検査）
  if (uploadedFile) {
    const MAX_EXCEL_FILE_SIZE = 20 * 1024 * 1024 // 20MB

    if (uploadedFile.data.length > MAX_EXCEL_FILE_SIZE) {
      throw createAppError({
        code: ErrorCode.CIRCUIT_IMPORT_INVALID,
        statusCode: 413,
        message: 'アップロード可能なファイルサイズは最大20MBまでです。',
      })
    }

    if (
      uploadedFile.data.length < 4
      || uploadedFile.data[0] !== 0x50
      || uploadedFile.data[1] !== 0x4B
    ) {
      throw createAppError({
        code: ErrorCode.CIRCUIT_IMPORT_INVALID,
        statusCode: 400,
        message: '無効なファイル形式です。有効なExcelファイル（.xlsx / .xlsm）を指定してください。',
      })
    }
  }

  // サーバー上のファイルパスを指定してインポートする場合、パスの安全性を検証
  if (!uploadedFile && targetPath) {
    try {
      targetPath = validateSafeExcelPath(targetPath, siteId)
    }
    catch (pathErr: unknown) {
      throw createAppError({
        code: ErrorCode.SYS_VALIDATION_FAILED,
        statusCode: 400,
        message: pathErr instanceof Error ? pathErr.message : '無効なファイルパスです',
      })
    }
  }

  try {
    let effectiveFilePath = targetPath

    if (uploadedFile) {
      const storageDir = path.resolve(process.cwd(), '.data', 'templates', siteId)

      await fs.promises.mkdir(storageDir, { recursive: true })

      const rawExt = path.extname(uploadedFile.filename || '').toLowerCase()
      const ext = rawExt === '.xlsm' ? '.xlsm' : '.xlsx'
      const baseName = sanitizeFilename(path.basename(uploadedFile.filename || '回路台帳', rawExt), '回路台帳')

      effectiveFilePath = path.join(storageDir, `${baseName}${ext}`)

      await fs.promises.writeFile(effectiveFilePath, uploadedFile.data)
    }

    const workerName = getUserDisplayName(user)
    const source = uploadedFile ? uploadedFile.data : targetPath
    const result = await importCircuitsFromExcel(
      siteId,
      source,
      workerName,
      mode,
      uploadedFile?.filename,
      effectiveFilePath || undefined,
    )

    return {
      success: true,
      count: result.count,
      createdCount: result.createdCount ?? result.count,
      updatedCount: result.updatedCount ?? 0,
      keptCount: result.keptCount ?? 0,
      deletedCount: result.deletedCount ?? 0,
      mode,
      filePath: effectiveFilePath || (uploadedFile?.filename ?? 'アップロードファイル'),
      excludedKeywords: result.excludedKeywords || [],
    }
  }
  catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    const err = error as Error

    throw createAppError({
      code: ErrorCode.CIRCUIT_IMPORT_INVALID,
      statusCode: 400,
      message: err.message || 'Excelファイルの取り込みに失敗しました',
    })
  }
})
