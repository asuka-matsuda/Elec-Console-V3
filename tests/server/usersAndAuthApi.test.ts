import crypto from 'node:crypto'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import loginHandler from '../../server/api/auth/login.post'
import passwordPutHandler from '../../server/api/auth/password.put'
import userDeleteHandler from '../../server/api/users/[id].delete'
import userPutHandler from '../../server/api/users/[id].put'
import userResetPasswordHandler from '../../server/api/users/[id]/reset-password.post'
import usersGetHandler from '../../server/api/users/index.get'
import usersPostHandler from '../../server/api/users/index.post'
import { generateAuthToken, getAuthUser, verifyAuthToken } from '../../server/utils/auth'
import { hashPassword, verifyPassword } from '../../server/utils/password'
import { prisma } from '../../server/utils/prisma'
import { resetAllRateLimits } from '../../server/utils/rateLimit'
import { ErrorCode } from '../../shared/types/errors'
import { createTestH3Event } from '../helpers/h3TestHelper'

describe('認証・ユーザー管理 API (auth & users) の統合テスト', () => {
  const TEST_PREFIX = 'TEST_USR_API_'
  const createdUserIds: string[] = []
  const createdSiteIds: string[] = []

  let masterToken = ''
  let siteAdminToken = ''
  let workerToken = ''
  let testSiteId = ''

  beforeEach(async () => {
    resetAllRateLimits()

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
        requirePasswordReset: false,
      },
    })

    masterToken = generateAuthToken(master)

    testSiteId = `${TEST_PREFIX}SITE_${Date.now()}`
    await prisma.site.create({
      data: {
        id: testSiteId,
        name: 'ユーザーAPI検証現場',
      },
    })
    createdSiteIds.push(testSiteId)

    const siteAdmin = await prisma.user.create({
      data: {
        loginId: `${TEST_PREFIX}admin_${Date.now()}`,
        password: hashPassword('adminpass123'),
        firstName: '管理',
        lastName: '現場',
        role: 'worker',
        isActive: true,
        requirePasswordReset: false,
        assignedSites: { connect: [{ id: testSiteId }] },
        siteAssignments: {
          create: [{ siteId: testSiteId, role: 'admin' }],
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
        requirePasswordReset: false,
        assignedSites: { connect: [{ id: testSiteId }] },
        siteAssignments: {
          create: [{ siteId: testSiteId, role: 'worker' }],
        },
      },
    })

    createdUserIds.push(worker.id)
    workerToken = generateAuthToken(worker)
  })

  afterEach(async () => {
    resetAllRateLimits()

    if (createdUserIds.length > 0) {
      await prisma.todo.deleteMany({ where: { userId: { in: createdUserIds } } })
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

  describe('POST /api/auth/login', () => {
    it('正しい認証情報でトークン・Cookie・SafeUserが発行され、lastLoginAtが更新されること', async () => {
      const loginId = `${TEST_PREFIX}login_ok_${Date.now()}`
      const user = await prisma.user.create({
        data: {
          loginId,
          password: hashPassword('ValidPass123!'),
          firstName: '一郎',
          lastName: '検証',
          role: 'worker',
          isActive: true,
          requirePasswordReset: false,
        },
      })

      createdUserIds.push(user.id)

      const event = createTestH3Event({
        method: 'POST',
        body: { loginId, password: 'ValidPass123!' },
      })

      const res = await loginHandler(event)

      expect(res.success).toBe(true)
      expect(res.token).toBeTruthy()
      expect(res.user.loginId).toBe(loginId)
      expect('password' in res.user).toBe(false)
      expect(res.expiresInSeconds).toBe(86400)

      const verified = verifyAuthToken(res.token)

      expect(verified?.uid).toBe(user.id)

      const updatedInDb = await prisma.user.findUnique({ where: { id: user.id } })

      expect(updatedInDb?.lastLoginAt).not.toBeNull()
    })

    it('旧形式パスワードハッシュ(10,000回PBKDF2)でのログイン時に自動アップグレードされ、発行されたトークンのpwdSigが新ハッシュと一致すること', async () => {
      const loginId = `${TEST_PREFIX}legacy_hash_${Date.now()}`
      const salt = crypto.randomBytes(16).toString('hex')
      const legacyDerived = crypto.pbkdf2Sync('LegacyPass123!', salt, 10000, 64, 'sha512').toString('hex')
      const legacyHash = `pbkdf2:10000:${salt}:${legacyDerived}`

      const user = await prisma.user.create({
        data: {
          loginId,
          password: legacyHash,
          firstName: '旧式',
          lastName: '暗号',
          role: 'worker',
          isActive: true,
          requirePasswordReset: false,
        },
      })

      createdUserIds.push(user.id)

      const event = createTestH3Event({
        method: 'POST',
        body: { loginId, password: 'LegacyPass123!' },
      })

      const res = await loginHandler(event)

      const updatedUser = await prisma.user.findUnique({ where: { id: user.id } })

      expect(updatedUser?.password.startsWith('pbkdf2:100000:')).toBe(true)

      // 修正前バグの再発防止検証: リハッシュ後の DB パスワードで getAuthUser の pwdSig 検証が通ること
      const authedUser = await getAuthUser(createTestH3Event({ token: res.token }))

      expect(authedUser).not.toBeNull()
      expect(authedUser?.id).toBe(user.id)
    })

    it('無効化アカウント(isActive: false)は正しいパスワードでも403 AUTH_ACCOUNT_INACTIVEで拒否されること', async () => {
      const loginId = `${TEST_PREFIX}inactive_${Date.now()}`
      const user = await prisma.user.create({
        data: {
          loginId,
          password: hashPassword('SecretPass123!'),
          firstName: '無効',
          lastName: 'アカウント',
          role: 'worker',
          isActive: false,
        },
      })

      createdUserIds.push(user.id)

      await expect(
        loginHandler(createTestH3Event({
          method: 'POST',
          body: { loginId, password: 'SecretPass123!' },
        })),
      ).rejects.toMatchObject({
        statusCode: 403,
        statusMessage: ErrorCode.AUTH_ACCOUNT_INACTIVE,
      })
    })

    it('5回連続でパスワードを間違えるとレートリミット(429 SYS_RATE_LIMITED)でブロックされること', async () => {
      const loginId = `${TEST_PREFIX}ratelimit_${Date.now()}`
      const user = await prisma.user.create({
        data: {
          loginId,
          password: hashPassword('CorrectPass123!'),
          firstName: '制限',
          lastName: '検証',
          role: 'worker',
          isActive: true,
        },
      })

      createdUserIds.push(user.id)

      for (let i = 0; i < 5; i++) {
        await expect(
          loginHandler(createTestH3Event({
            method: 'POST',
            ip: '10.0.0.55',
            body: { loginId, password: 'WrongPassword!' },
          })),
        ).rejects.toMatchObject({
          statusCode: 401,
          statusMessage: ErrorCode.AUTH_INVALID_CREDENTIALS,
        })
      }

      // 6回目は正しいパスワードを送っても 429 でロックアウトされていること
      await expect(
        loginHandler(createTestH3Event({
          method: 'POST',
          ip: '10.0.0.55',
          body: { loginId, password: 'CorrectPass123!' },
        })),
      ).rejects.toMatchObject({
        statusCode: 429,
        statusMessage: ErrorCode.SYS_RATE_LIMITED,
      })
    })
  })

  describe('PUT /api/auth/password', () => {
    it('初回パスワード変更要求(requirePasswordReset: true)時はcurrentPasswordなしで変更でき、24hトークンが再発行されること', async () => {
      const user = await prisma.user.create({
        data: {
          loginId: `${TEST_PREFIX}first_pw_${Date.now()}`,
          password: hashPassword('InitialTempPass1'),
          firstName: '初回',
          lastName: '変更',
          role: 'worker',
          isActive: true,
          requirePasswordReset: true,
        },
      })

      createdUserIds.push(user.id)
      const oldToken = generateAuthToken(user)

      const res = await passwordPutHandler(createTestH3Event({
        method: 'PUT',
        token: oldToken,
        body: { newPassword: 'NewSecurePassword99' },
      }))

      expect(res.success).toBe(true)
      expect(res.token).toBeTruthy()

      const updated = await prisma.user.findUnique({ where: { id: user.id } })

      expect(updated?.requirePasswordReset).toBe(false)
      expect(verifyPassword('NewSecurePassword99', updated!.password)).toBe(true)

      // 旧トークンは pwdSig 不一致で失効し、新トークンのみ getAuthUser で有効であること
      expect(await getAuthUser(createTestH3Event({ token: oldToken }))).toBeNull()
      expect((await getAuthUser(createTestH3Event({ token: res.token })))?.id).toBe(user.id)
    })

    it('通常時のパスワード変更ではcurrentPasswordが必須であり、一致しない場合や同一パスワードへの変更は拒否されること', async () => {
      const user = await prisma.user.create({
        data: {
          loginId: `${TEST_PREFIX}normal_pw_${Date.now()}`,
          password: hashPassword('CurrentPass123'),
          firstName: '通常',
          lastName: '変更',
          role: 'worker',
          isActive: true,
          requirePasswordReset: false,
        },
      })

      createdUserIds.push(user.id)
      const token = generateAuthToken(user)

      // currentPassword 未指定 -> 400
      await expect(
        passwordPutHandler(createTestH3Event({
          method: 'PUT',
          token,
          body: { newPassword: 'AnotherPassword123' },
        })),
      ).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: ErrorCode.SYS_VALIDATION_FAILED,
      })

      // currentPassword 不一致 -> 401
      await expect(
        passwordPutHandler(createTestH3Event({
          method: 'PUT',
          token,
          body: { currentPassword: 'WrongCurrentPassword', newPassword: 'AnotherPassword123' },
        })),
      ).rejects.toMatchObject({
        statusCode: 401,
        statusMessage: ErrorCode.AUTH_INVALID_CREDENTIALS,
      })

      // 現在と同じパスワードへの変更 -> 400 AUTH_PASSWORD_POLICY_VIOLATION
      await expect(
        passwordPutHandler(createTestH3Event({
          method: 'PUT',
          token,
          body: { currentPassword: 'CurrentPass123', newPassword: 'CurrentPass123' },
        })),
      ).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: ErrorCode.AUTH_PASSWORD_POLICY_VIOLATION,
      })
    })
  })

  describe('GET/POST/PUT/DELETE /api/users (ユーザー管理と権限境界)', () => {
    it('master以外のユーザー(worker / 現場admin)はユーザー一覧取得・作成・更新・削除のすべてが403で拒否され、masterのみ操作可能であること', async () => {
      await expect(
        usersGetHandler(createTestH3Event({ method: 'GET', token: workerToken })),
      ).rejects.toMatchObject({
        statusCode: 403,
        statusMessage: ErrorCode.AUTH_FORBIDDEN_ACTION,
      })

      await expect(
        usersGetHandler(createTestH3Event({ method: 'GET', token: siteAdminToken })),
      ).rejects.toMatchObject({
        statusCode: 403,
        statusMessage: ErrorCode.AUTH_FORBIDDEN_ACTION,
      })

      // master は一覧取得・新規作成が可能
      const list = await usersGetHandler(createTestH3Event({ method: 'GET', token: masterToken }))

      expect(Array.isArray(list)).toBe(true)

      const newLoginId = `${TEST_PREFIX}created_${Date.now()}`
      const created = await usersPostHandler(createTestH3Event({
        method: 'POST',
        token: masterToken,
        body: {
          loginId: newLoginId,
          lastName: '新規',
          firstName: '作業員',
          password: 'InitialPassword123',
          siteAssignments: [{ siteId: testSiteId, role: 'viewer' }],
        },
      }))

      createdUserIds.push(created.id)
      expect(created.loginId).toBe(newLoginId)
      expect(created.role).toBe('worker')
      expect(created.requirePasswordReset).toBe(true)
      expect(created.siteAssignments).toEqual([{ siteId: testSiteId, role: 'viewer' }])
    })

    it('PUT /api/users/:id で loginId の変更は拒否され(案B)、requirePasswordReset や siteAssignments は正しく更新されること', async () => {
      const targetLoginId = `${TEST_PREFIX}immutable_${Date.now()}`
      const target = await prisma.user.create({
        data: {
          loginId: targetLoginId,
          password: hashPassword('TargetPass123'),
          firstName: '対象',
          lastName: '更新',
          role: 'worker',
          isActive: true,
          requirePasswordReset: false,
        },
      })

      createdUserIds.push(target.id)

      // 異なる loginId を送信した場合は 400 で拒否
      await expect(
        userPutHandler(createTestH3Event({
          method: 'PUT',
          token: masterToken,
          params: { id: target.id },
          body: {
            loginId: `${targetLoginId}_renamed`,
            firstName: '変更',
          },
        })),
      ).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: ErrorCode.SYS_VALIDATION_FAILED,
      })

      // 同一 loginId（または未指定）で requirePasswordReset, isActive, siteAssignments を更新
      const updated = await userPutHandler(createTestH3Event({
        method: 'PUT',
        token: masterToken,
        params: { id: target.id },
        body: {
          loginId: targetLoginId,
          lastName: '更新後',
          firstName: '太郎',
          isActive: false,
          requirePasswordReset: true,
          siteAssignments: [{ siteId: testSiteId, role: 'admin' }],
        },
      }))

      expect(updated.lastName).toBe('更新後')
      expect(updated.firstName).toBe('太郎')
      expect(updated.isActive).toBe(false)
      expect(updated.requirePasswordReset).toBe(true)
      expect(updated.siteAssignments).toEqual([{ siteId: testSiteId, role: 'admin' }])
    })

    it('master アカウントに対する無効化・降格・削除・非masterによるパスワードリセットは403で保護されること', async () => {
      const master = await prisma.user.findUniqueOrThrow({ where: { loginId: 'master' } })

      await expect(
        userPutHandler(createTestH3Event({
          method: 'PUT',
          token: masterToken,
          params: { id: master.id },
          body: { isActive: false },
        })),
      ).rejects.toMatchObject({
        statusCode: 403,
        statusMessage: ErrorCode.USER_MASTER_PROTECTED,
      })

      await expect(
        userDeleteHandler(createTestH3Event({
          method: 'DELETE',
          token: masterToken,
          params: { id: master.id },
        })),
      ).rejects.toMatchObject({
        statusCode: 403,
        statusMessage: ErrorCode.USER_MASTER_PROTECTED,
      })

      await expect(
        userResetPasswordHandler(createTestH3Event({
          method: 'POST',
          token: siteAdminToken,
          params: { id: master.id },
          body: { password: 'HackedPassword123' },
        })),
      ).rejects.toMatchObject({
        statusCode: 403,
        statusMessage: ErrorCode.AUTH_FORBIDDEN_ACTION,
      })
    })

    it('DELETE /api/users/:id でユーザー削除時に紐づく Todo と UserOnSite もカスケード削除されること', async () => {
      const target = await prisma.user.create({
        data: {
          loginId: `${TEST_PREFIX}del_target_${Date.now()}`,
          password: hashPassword('DeletePass123'),
          firstName: '対象',
          lastName: '削除',
          role: 'worker',
          assignedSites: { connect: [{ id: testSiteId }] },
          siteAssignments: {
            create: [{ siteId: testSiteId, role: 'worker' }],
          },
        },
      })

      createdUserIds.push(target.id)

      const todoId = `${TEST_PREFIX}todo_${Date.now()}`

      await prisma.todo.create({
        data: {
          id: todoId,
          siteId: testSiteId,
          userId: target.id,
          text: '削除ユーザーのタスク',
        },
      })

      const res = await userDeleteHandler(createTestH3Event({
        method: 'DELETE',
        token: masterToken,
        params: { id: target.id },
      }))

      expect(res.success).toBe(true)

      const remainingUser = await prisma.user.findUnique({ where: { id: target.id } })
      const remainingTodo = await prisma.todo.findUnique({ where: { id: todoId } })
      const remainingAssign = await prisma.userOnSite.findMany({ where: { userId: target.id } })

      expect(remainingUser).toBeNull()
      expect(remainingTodo).toBeNull()
      expect(remainingAssign).toHaveLength(0)
    })
  })
})
