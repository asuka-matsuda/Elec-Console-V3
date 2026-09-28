/**
 * 計算履歴一覧取得 API
 * GET /api/calc-history
 *
 * @description ログインユーザー（または共有）の計算ツール実行履歴を取得します。
 */

import { defineEventHandler, getQuery } from 'h3'

import { getAuthUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await getAuthUser(event)
  const query = getQuery(event)
  const toolId = query.toolId as string | undefined

  const settingKey = `calc_history_${user?.loginId || 'shared'}`

  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: settingKey },
    })

    if (!setting || !setting.value) {
      return {
        success: true,
        history: [],
      }
    }

    let items = JSON.parse(setting.value) as Array<{ id: string, toolId: string, timestamp: string }>

    if (toolId) {
      items = items.filter(item => item.toolId === toolId)
    }

    return {
      success: true,
      history: items,
    }
  }
  catch (error) {
    console.error('Failed to get calc-history:', error)

    return {
      success: true,
      history: [],
    }
  }
})
