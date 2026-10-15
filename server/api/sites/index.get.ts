/**
 * 現場一覧取得 API
 * GET /api/sites
 *
 * @description 登録されている現場一覧を取得します。一般ユーザーは担当現場のみにフィルタされます。
 * @permission 認証済みユーザー
 */

import { defineEventHandler } from 'h3'

import { isSuperUser, requireAuthUser } from '../../utils/auth'
import { parseAssignedReports, parseExcludedCircuits, parseNoBreakWords } from '../../utils/jsonFields'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)

  // master（松田飛鳥氏）のみ全現場（無効化現場を含む）を閲覧可能。一般adminを含む他ユーザーは自身に割り当てられた有効な現場のみに限定
  const where = isSuperUser(user)
    ? {}
    : { id: { in: user.assignedSiteIds }, disabledAt: null }

  const sites = await prisma.site.findMany({
    where,
    include: {
      // パスワードハッシュの漏洩を防止するため、必要な安全フィールドのみを明示的にselect
      users: {
        select: {
          id: true,
          loginId: true,
          firstName: true,
          lastName: true,
          firstNameKana: true,
          lastNameKana: true,
          role: true,
          isActive: true,
        },
      },
      settings: true,
    },
  })

  const siteSettings = sites
    .map(s => s.settings)
    .filter((s): s is NonNullable<typeof s> => s !== null)

  const mappedSites = sites.map((site) => {
    return {
      ...site,
      excelPath: site.settings?.excelPath || undefined,
      excludedCircuits: parseExcludedCircuits(site.settings?.excludedCircuits),
      noBreakWords: parseNoBreakWords(site.settings?.noBreakWords),
      assignedReports: parseAssignedReports(site.settings?.assignedReports),
    }
  })

  return { sites: mappedSites, siteSettings }
})
