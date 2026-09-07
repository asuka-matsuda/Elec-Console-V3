import { createError, defineEventHandler, getHeader, getRouterParam, readBody, readMultipartFormData } from 'h3'

import { requireSiteAccess } from '../../../../utils/auth'
import { importCircuitsFromExcel, validateSafeExcelPath } from '../../../../utils/circuitExcel'
import { prisma } from '../../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireSiteAccess(event)

  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createError({
      statusCode: 400,
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
    throw createError({
      statusCode: 400,
      message: 'Excelファイルが選択されていないか、連携ファイルの保存先パスが設定されていません。',
    })
  }

  // サーバー上のファイルパスを指定してインポートする場合、パスの安全性を検証
  if (!uploadedFile && targetPath) {
    try {
      targetPath = validateSafeExcelPath(targetPath)
    }
    catch (pathErr: unknown) {
      throw createError({
        statusCode: 400,
        message: pathErr instanceof Error ? pathErr.message : '無効なファイルパスです',
      })
    }
  }

  try {
    const workerName = `${user.lastName} ${user.firstName}`.trim() || user.loginId
    const source = uploadedFile ? uploadedFile.data : targetPath
    const result = await importCircuitsFromExcel(
      siteId,
      source,
      workerName,
      mode,
      uploadedFile?.filename,
    )

    return {
      success: true,
      count: result.count,
      createdCount: result.createdCount ?? result.count,
      updatedCount: result.updatedCount ?? 0,
      keptCount: result.keptCount ?? 0,
      deletedCount: result.deletedCount ?? 0,
      mode,
      filePath: targetPath || (uploadedFile?.filename ?? 'アップロードファイル'),
    }
  }
  catch (error: unknown) {
    const err = error as Error

    console.error('Failed to import circuits from Excel:', err)

    throw createError({
      statusCode: 500,
      message: err.message || 'Excelファイルの取り込みに失敗しました',
    })
  }
})
