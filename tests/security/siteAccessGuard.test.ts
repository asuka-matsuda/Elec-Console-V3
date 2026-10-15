import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  generateAuthToken,
  requireAuthUser,
  requireMasterUser,
  requireSiteAccess,
  requireSiteAdmin,
  requireSiteRole,
} from '../../server/utils/auth'
import { hashPassword } from '../../server/utils/password'
import { prisma } from '../../server/utils/prisma'
import { ErrorCode } from '../../shared/types/errors'
import { createTestH3Event } from '../helpers/h3TestHelper'

describe('Site Access & Role Guards (server/utils/auth.ts の実関数検証)', () => {
  const TEST_PREFIX = 'TEST_GUARD_'
  const createdUserIds: string[] = []
  const createdSiteIds: string[] = []

  let activeSiteId = ''
  let disabledSiteId = ''
  let unassignedSiteId = ''

  let masterToken = ''
  let siteAdminToken = ''
  let workerToken = ''
  let viewerToken = ''

  beforeEach(async () => {
    activeSiteId = `${TEST_PREFIX}ACTIVE_${Date.now()}`
    disabledSiteId = `${TEST_PREFIX}DISABLED_${Date.now()}`
    unassignedSiteId = `${TEST_PREFIX}UNASSIGNED_${Date.now()}`

    await prisma.site.createMany({
      data: [
        { id: activeSiteId, name: '稼働中現場', disabledAt: null },
        { id: disabledSiteId, name: '無効化現場', disabledAt: new Date() },
        { id: unassignedSiteId, name: '未アサイン現場', disabledAt: null },
      ],
    })
    createdSiteIds.push(activeSiteId, disabledSiteId, unassignedSiteId)

    const master = await prisma.user.upsert({
      where: { loginId: 'master' },
      update: { isActive: true, role: 'master' },
      create: {
        loginId: 'master',
        password: hashPassword('masterpass123'),
        firstName: '飛鳥',
        lastName: '松田',
        role: 'master',
        isActive: true,
      },
    })

    masterToken = generateAuthToken(master)

    const siteAdmin = await prisma.user.create({
      data: {
        loginId: `${TEST_PREFIX}admin_${Date.now()}`,
        password: hashPassword('adminpass123'),
        firstName: '管理',
        lastName: '現場',
        role: 'worker',
        isActive: true,
        assignedSites: {
          connect: [{ id: activeSiteId }, { id: disabledSiteId }],
        },
        siteAssignments: {
          create: [
            { siteId: activeSiteId, role: 'admin' },
            { siteId: disabledSiteId, role: 'admin' },
          ],
        },
      },
    })

    createdUserIds.push(siteAdmin.id)
    siteAdminToken = generateAuthToken(siteAdmin)

    const worker = await prisma.user.create({
      data: {
        loginId: `${TEST_PREFIX}worker_${Date.now()}`,
        password: hashPassword('workerpass123'),
        firstName: '太郎',
        lastName: '作業',
        role: 'worker',
        isActive: true,
        assignedSites: {
          connect: [{ id: activeSiteId }],
        },
        siteAssignments: {
          create: [{ siteId: activeSiteId, role: 'worker' }],
        },
      },
    })

    createdUserIds.push(worker.id)
    workerToken = generateAuthToken(worker)

    const viewer = await prisma.user.create({
      data: {
        loginId: `${TEST_PREFIX}viewer_${Date.now()}`,
        password: hashPassword('viewerpass123'),
        firstName: '次郎',
        lastName: '閲覧',
        role: 'worker',
        isActive: true,
        assignedSites: {
          connect: [{ id: activeSiteId }],
        },
        siteAssignments: {
          create: [{ siteId: activeSiteId, role: 'viewer' }],
        },
      },
    })

    createdUserIds.push(viewer.id)
    viewerToken = generateAuthToken(viewer)
  })

  afterEach(async () => {
    if (createdUserIds.length > 0) {
      await prisma.userOnSite.deleteMany({ where: { userId: { in: createdUserIds } } })
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
      createdUserIds.length = 0
    }

    if (createdSiteIds.length > 0) {
      await prisma.userOnSite.deleteMany({ where: { siteId: { in: createdSiteIds } } })
      await prisma.site.deleteMany({ where: { id: { in: createdSiteIds } } })
      createdSiteIds.length = 0
    }
  })

  describe('requireAuthUser & requireMasterUser', () => {
    it('パスワード変更や無効化が起きた場合、発行済みトークンでも即座に401で拒否されること', async () => {
      const tempUser = await prisma.user.create({
        data: {
          loginId: `${TEST_PREFIX}temp_${Date.now()}`,
          password: hashPassword('OldPassword123'),
          firstName: '一時',
          lastName: 'ユーザー',
          role: 'worker',
          isActive: true,
        },
      })

      createdUserIds.push(tempUser.id)
      const token = generateAuthToken(tempUser)

      // 初期状態では認証成功
      const authed = await requireAuthUser(createTestH3Event({ token }))

      expect(authed.id).toBe(tempUser.id)

      // パスワード変更後は pwdSig 不一致で 401
      await prisma.user.update({
        where: { id: tempUser.id },
        data: { password: hashPassword('NewPassword456') },
      })

      await expect(
        requireAuthUser(createTestH3Event({ token })),
      ).rejects.toMatchObject({
        statusCode: 401,
        statusMessage: ErrorCode.AUTH_UNAUTHORIZED,
      })
    })

    it('requireMasterUser は master 以外の現場 admin を 403 AUTH_FORBIDDEN_ACTION で拒否すること', async () => {
      const masterRes = await requireMasterUser(createTestH3Event({ token: masterToken }))

      expect(masterRes.loginId).toBe('master')
      expect(masterRes.role).toBe('master')

      await expect(
        requireMasterUser(createTestH3Event({ token: siteAdminToken })),
      ).rejects.toMatchObject({
        statusCode: 403,
        statusMessage: ErrorCode.AUTH_FORBIDDEN_ACTION,
      })
    })
  })

  describe('requireSiteAccess / requireSiteAdmin / requireSiteRole', () => {
    it('未アサイン現場へのアクセスは master のみ許可され、現場 admin や worker は 403 AUTH_FORBIDDEN_ACTION となること', async () => {
      const masterRes = await requireSiteAccess(createTestH3Event({ token: masterToken }), unassignedSiteId)

      expect(masterRes.loginId).toBe('master')

      await expect(
        requireSiteAccess(createTestH3Event({ token: siteAdminToken }), unassignedSiteId),
      ).rejects.toMatchObject({
        statusCode: 403,
        statusMessage: ErrorCode.AUTH_FORBIDDEN_ACTION,
      })

      await expect(
        requireSiteAccess(createTestH3Event({ token: workerToken }), unassignedSiteId),
      ).rejects.toMatchObject({
        statusCode: 403,
        statusMessage: ErrorCode.AUTH_FORBIDDEN_ACTION,
      })
    })

    it('無効化された現場(disabledAt !== null)は master のみ操作でき、アサイン済みの現場 admin でも 403 AUTH_FORBIDDEN_ACTION で拒否されること', async () => {
      const masterRes = await requireSiteAccess(createTestH3Event({ token: masterToken }), disabledSiteId)

      expect(masterRes.loginId).toBe('master')

      await expect(
        requireSiteAccess(createTestH3Event({ token: siteAdminToken }), disabledSiteId),
      ).rejects.toMatchObject({
        statusCode: 403,
        statusMessage: ErrorCode.AUTH_FORBIDDEN_ACTION,
      })

      await expect(
        requireSiteAdmin(createTestH3Event({ token: siteAdminToken }), disabledSiteId),
      ).rejects.toMatchObject({
        statusCode: 403,
        statusMessage: ErrorCode.AUTH_FORBIDDEN_ACTION,
      })
    })

    it('requireSiteRole([admin, worker]) は viewer を 403 AUTH_FORBIDDEN_ACTION でブロックし、worker と admin は許可すること', async () => {
      const adminRes = await requireSiteRole(
        createTestH3Event({ token: siteAdminToken }),
        ['admin', 'worker'],
        activeSiteId,
      )

      expect(adminRes.id).toBeTruthy()

      const workerRes = await requireSiteRole(
        createTestH3Event({ token: workerToken }),
        ['admin', 'worker'],
        activeSiteId,
      )

      expect(workerRes.id).toBeTruthy()

      await expect(
        requireSiteRole(
          createTestH3Event({ token: viewerToken }),
          ['admin', 'worker'],
          activeSiteId,
        ),
      ).rejects.toMatchObject({
        statusCode: 403,
        statusMessage: ErrorCode.AUTH_FORBIDDEN_ACTION,
      })
    })
  })
})
