/**
 * 現場設定のExcel連携テンプレートファイル登録・更新 API
 * POST /api/sites/:siteId/circuits/template
 *
 * @description 現場の回路台帳元Excelファイル（.xlsx または .xlsm）をサーバーへアップロードし、
 * 現場設定（excelPath）に紐付けます。回路データ自体のインポート・再作成は行いません。
 * @permission 現場アクセス権限
 */
import fs from 'node:fs'
import path from 'node:path'

import { defineEventHandler, getHeader, getRouterParam, readMultipartFormData } from 'h3'

import { ErrorCode } from '#shared/types/errors'
import { sanitizeFilename } from '#shared/utils/filename'
import { getUserDisplayName } from '#shared/utils/user'

import { requireSiteAdmin } from '../../../../utils/auth'
import { createAppError } from '../../../../utils/error'
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

  const site = await prisma.site.findUnique({
    where: { id: siteId },
  })

  if (!site) {
    throw createAppError({
      code: ErrorCode.SITE_NOT_FOUND,
      message: '指定された現場が見つかりません',
    })
  }

  const contentType = getHeader(event, 'content-type') || ''

  if (!contentType.includes('multipart/form-data')) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: 'multipart/form-data 形式でファイルをアップロードしてください',
    })
  }

  const formData = await readMultipartFormData(event)
  let uploadedFile: { data: Buffer, filename?: string } | null = null

  if (formData) {
    for (const part of formData) {
      if (part.name === 'file' && part.data) {
        uploadedFile = { data: part.data, filename: part.filename }
      }
    }
  }

  if (!uploadedFile || !uploadedFile.data || uploadedFile.data.length === 0) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: 'アップロードするExcelファイルが選択されていません',
    })
  }

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

  const rawExt = path.extname(uploadedFile.filename || '').toLowerCase()

  if (rawExt !== '.xlsx' && rawExt !== '.xlsm') {
    throw createAppError({
      code: ErrorCode.CIRCUIT_IMPORT_INVALID,
      statusCode: 400,
      message: 'Excelファイル形式（.xlsx または .xlsm）のみアップロード可能です',
    })
  }

  const storageDir = path.resolve(process.cwd(), '.data', 'templates', siteId)

  await fs.promises.mkdir(storageDir, { recursive: true })

  const baseName = sanitizeFilename(path.basename(uploadedFile.filename || '回路台帳', rawExt), '回路台帳')
  const targetFileName = `${baseName}${rawExt}`
  const targetFilePath = path.join(storageDir, targetFileName)

  await fs.promises.writeFile(targetFilePath, uploadedFile.data)

  const workerName = getUserDisplayName(user)

  await prisma.$transaction([
    prisma.siteSettings.upsert({
      where: { siteId },
      create: { siteId, excelPath: targetFilePath },
      update: { excelPath: targetFilePath },
    }),
    prisma.operationLog.create({
      data: {
        siteId,
        worker: workerName,
        action: 'Excelテンプレート登録',
        targetBan: '全体',
        targetKairo: 'テンプレート設定',
        details: `帳票用Excelファイル「${uploadedFile.filename}」をサーバーに登録しました`,
      },
    }),
  ])

  return {
    success: true,
    filePath: targetFilePath,
    filename: targetFileName,
    message: `Excelファイル「${targetFileName}」を登録しました。`,
  }
})
