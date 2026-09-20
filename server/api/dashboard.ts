import { defineEventHandler } from 'h3'

import announcementsSeed from '../data/announcements.json'
import historySeed from '../data/history.json'
import { requireAuthUser } from '../utils/auth'
import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  // 認証済みユーザーのみアクセス可能（未認証の外部・Botからの漏洩を防止）
  await requireAuthUser(event)

  // 1. お知らせの取得（未登録時はシードから初期化）
  let announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: 'desc' },
  })

  if (announcements.length === 0 && announcementsSeed.length > 0) {
    for (const item of announcementsSeed) {
      await prisma.announcement.create({
        data: {
          title: item.title,
          date: item.date,
          desc: item.desc,
        },
      })
    }
    announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  // 2. 更新履歴の取得（未登録時はシードから初期化）
  let history = await prisma.history.findMany({
    orderBy: { createdAt: 'desc' },
  })

  if (history.length === 0 && historySeed.length > 0) {
    for (const item of historySeed) {
      await prisma.history.create({
        data: {
          version: item.version,
          title: item.title,
          date: item.date,
          desc: item.desc,
          status: item.status || 'neutral',
        },
      })
    }
    history = await prisma.history.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  return {
    announcements,
    history,
  }
})
