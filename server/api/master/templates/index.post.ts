/**
 * マスター帳票テンプレート登録・更新 API
 * POST /api/master/templates
 *
 * @description システム共通のひな形Excelファイルをアップロードして登録します。
 * @permission マスター管理者限定
 */

import path from 'node:path'

import { createError, defineEventHandler, getHeader, readMultipartFormData } from 'h3'

import type { ReportLogicType } from '#shared/types/reportTemplate'

import { requireMasterUser } from '../../../utils/auth'
import { saveMasterTemplateItem } from '../../../utils/masterTemplates'

const VALID_LOGIC_TYPES: ReportLogicType[] = ['tag', 'socket-tepra', 'exam', 'remote']

export default defineEventHandler(async (event) => {
  await requireMasterUser(event)

  const contentType = getHeader(event, 'content-type') || ''

  if (!contentType.includes('multipart/form-data')) {
    throw createError({
      statusCode: 400,
      message: 'multipart/form-data 形式でファイルを送信してください',
    })
  }

  const formData = await readMultipartFormData(event)

  if (!formData) {
    throw createError({
      statusCode: 400,
      message: 'フォームデータが見つかりません',
    })
  }

  let id: string | undefined
  let name = ''
  let logicType: ReportLogicType | null = null
  let description = ''
  let isAllSites = true
  let assignedSiteIds: string[] = []
  let fileData: Buffer | undefined
  let originalFilename = ''

  for (const part of formData) {
    if (part.name === 'id') {
      id = part.data.toString('utf-8').trim() || undefined
    }
    else if (part.name === 'name') {
      name = part.data.toString('utf-8').trim()
    }
    else if (part.name === 'logicType' || part.name === 'templateId') {
      logicType = part.data.toString('utf-8').trim() as ReportLogicType
    }
    else if (part.name === 'description') {
      description = part.data.toString('utf-8').trim()
    }
    else if (part.name === 'isAllSites') {
      const val = part.data.toString('utf-8').trim()

      isAllSites = val === 'true' || val === '1'
    }
    else if (part.name === 'assignedSiteIds') {
      try {
        const raw = part.data.toString('utf-8').trim()

        if (raw.startsWith('[')) {
          assignedSiteIds = JSON.parse(raw)
        }
        else if (raw) {
          assignedSiteIds = raw.split(',').map(s => s.trim()).filter(Boolean)
        }
      }
      catch {
        assignedSiteIds = []
      }
    }
    else if (part.name === 'file' && part.data && part.data.length > 0) {
      fileData = part.data
      originalFilename = part.filename || 'template.xlsx'
    }
  }

  if (!logicType || !VALID_LOGIC_TYPES.includes(logicType)) {
    throw createError({
      statusCode: 400,
      message: '有効な帳票ロジック種別（tag, socket-tepra, exam, remote）を指定してください',
    })
  }

  if (!name) {
    // 未入力時はロジックに応じたデフォルト名
    const defaultNames: Record<ReportLogicType, string> = {
      'tag': '線名札（タグ枠）',
      'socket-tepra': 'コンセント用テプラ元データ',
      'exam': '送電試験結果成績書',
      'remote': 'フル2線式リモコン設定表',
    }

    name = defaultNames[logicType] || '帳票テンプレート'
  }

  // 新規登録時はファイル必須
  if (!id && (!fileData || fileData.length === 0)) {
    throw createError({
      statusCode: 400,
      message: 'アップロードするExcelファイルを選択してください',
    })
  }

  if (fileData && originalFilename) {
    const ext = path.extname(originalFilename).toLowerCase()

    if (ext !== '.xlsx' && ext !== '.xlsm' && ext !== '.xls') {
      throw createError({
        statusCode: 400,
        message: 'Excelファイル形式（.xlsx, .xlsm, .xls）のみアップロード可能です',
      })
    }
  }

  const savedItem = await saveMasterTemplateItem({
    id,
    name,
    logicType,
    description,
    isAllSites,
    assignedSiteIds,
    fileBuffer: fileData,
    originalFilename,
  })

  return {
    success: true,
    item: savedItem,
    template: savedItem,
    // 旧互換
    templateId: savedItem.logicType,
    file: savedItem.file,
  }
})
