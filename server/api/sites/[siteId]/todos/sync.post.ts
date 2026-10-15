/**
 * 現場パーソナルToDo同期 ＆ マイグレーション API
 * POST /api/sites/:siteId/todos/sync
 *
 * @description クライアントローカル（IndexedDB）のToDoをサーバーDBへ安全にアップロード・同期し、
 * サーバー上の最新完全リストを返却します。
 */

import { defineEventHandler, getRouterParam, readBody } from 'h3'

import { ErrorCode } from '#shared/types/errors'

import { requireSiteRole } from '../../../../utils/auth'
import { parseValidDate } from '../../../../utils/date'
import { createAppError } from '../../../../utils/error'
import { prisma } from '../../../../utils/prisma'

interface SyncRequestBody {
  localTodos?: Array<{
    id: string
    text: string
    completed: boolean
    createdAt?: string
    updatedAt?: string
  }>
  deletedIds?: string[]
}

export default defineEventHandler(async (event) => {
  const user = await requireSiteRole(event, ['admin', 'worker'])
  const siteId = getRouterParam(event, 'siteId')

  if (!siteId) {
    throw createAppError({
      code: ErrorCode.SYS_VALIDATION_FAILED,
      message: '現場IDが指定されていません',
    })
  }

  const userKeys = Array.from(new Set([user.id, user.loginId].filter(Boolean)))
  const body = (await readBody<SyncRequestBody>(event).catch(() => null)) || {}
  const localTodos = Array.isArray(body.localTodos) ? body.localTodos : []
  const deletedIds = Array.isArray(body.deletedIds) ? body.deletedIds.filter(Boolean) : []

  const allTodos = await prisma.$transaction(async (tx) => {
    // 0. クライアント側で削除されたToDoがあればサーバーDBからも削除
    if (deletedIds.length > 0) {
      await tx.todo.deleteMany({
        where: {
          id: { in: deletedIds },
          siteId,
          userId: { in: userKeys },
        },
      })
    }

    // 1. ローカルから送られてきたToDoをサーバーDBへUpsert
    for (const item of localTodos) {
      const trimmedText = typeof item?.text === 'string' ? item.text.trim() : ''

      if (!item?.id || !trimmedText || deletedIds.includes(item.id)) continue

      const createdAt = parseValidDate(item.createdAt) || new Date()
      const updatedAt = parseValidDate(item.updatedAt) || new Date()

      const existing = await tx.todo.findUnique({
        where: { id: item.id },
      })

      if (!existing) {
        await tx.todo.create({
          data: {
            id: item.id,
            siteId,
            userId: user.loginId,
            text: trimmedText,
            completed: Boolean(item.completed),
            createdAt,
            updatedAt,
          },
        })
      }
      else if (userKeys.includes(existing.userId) && existing.siteId === siteId) {
        // 既存レコードがある場合、ローカルの方が新しければ更新
        if (updatedAt >= existing.updatedAt) {
          await tx.todo.update({
            where: { id: item.id },
            data: {
              userId: user.loginId,
              text: trimmedText,
              completed: Boolean(item.completed),
              updatedAt,
            },
          })
        }
      }
    }

    // 2. サーバーDBの最新ToDo一覧を取得して返却
    return tx.todo.findMany({
      where: {
        siteId,
        userId: { in: userKeys },
      },
      orderBy: [
        { completed: 'asc' },
        { createdAt: 'desc' },
      ],
    })
  })

  return {
    success: true,
    todos: allTodos.map(t => ({
      id: t.id,
      siteId: t.siteId,
      userId: user.loginId,
      text: t.text,
      completed: t.completed,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
  }
})
