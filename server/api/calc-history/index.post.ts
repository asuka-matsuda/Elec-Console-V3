/**
 * 計算履歴登録 API
 * POST /api/calc-history
 *
 * @description 計算ツールの結果をユーザーの計算履歴としてデータベースに永続化します。
 */

import { randomUUID } from 'node:crypto'

import { defineEventHandler } from 'h3'
import { z } from 'zod'

import { requireAuthUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'
import { validateRequestBody } from '../../utils/validation'

const HistoryEntrySchema = z.object({
  id: z.string().max(100).optional(),
  toolId: z.string().max(50).optional(),
  toolName: z.string().max(100).optional(),
  mode: z.string().max(50).optional(),
  timestamp: z.string().max(50).optional(),
  status: z.enum(['success', 'error', 'warning']).optional(),
  mainResultText: z.string().max(500).optional(),
  inputs: z.array(z.object({
    label: z.string().max(100),
    value: z.string().max(500),
  })).max(50).optional(),
  results: z.array(z.object({
    label: z.string().max(100),
    value: z.string().max(500),
    isMain: z.boolean().optional(),
    color: z.string().max(50).optional(),
  })).max(50).optional(),
  rawInputs: z.record(z.unknown()).optional(),
  rawResult: z.record(z.unknown()).optional(),
}).passthrough()

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const body = await validateRequestBody(event, HistoryEntrySchema)

  const settingKey = `calc_history_${user.loginId}`

  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: settingKey },
    })

    let currentList: Array<{ id: string, toolId?: string, timestamp?: string }> = []

    if (setting?.value) {
      try {
        currentList = JSON.parse(setting.value)
      }
      catch {
        currentList = []
      }
    }

    const newEntry = {
      ...body,
      id: body.id || randomUUID(),
      timestamp: body.timestamp || new Date().toISOString(),
    }

    // 先頭に追加し、最大30件に制限
    currentList = [newEntry, ...currentList.filter(item => item.id !== newEntry.id)].slice(0, 30)

    await prisma.systemSetting.upsert({
      where: { key: settingKey },
      update: { value: JSON.stringify(currentList) },
      create: { key: settingKey, value: JSON.stringify(currentList) },
    })

    return {
      success: true,
      entry: newEntry,
    }
  }
  catch (error) {
    console.error('Failed to save calc-history:', error)

    return {
      success: false,
      error: '計算履歴の保存に失敗しました。',
    }
  }
})
