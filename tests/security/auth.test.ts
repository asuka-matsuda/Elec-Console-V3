import { describe, expect, it } from 'vitest'

import {
  canAccessSite,
  generateAuthToken,
  isSuperUser,
  type SafeUser,
  verifyAuthToken,
} from '../../server/utils/auth'

describe('Authentication & Token Security', () => {
  const dummyUser = {
    id: 'user-uuid-1',
    loginId: 'worker1',
    role: 'worker',
  }

  it('should generate valid signed token and verify it correctly', () => {
    const token = generateAuthToken(dummyUser)

    expect(token).toContain('.')

    const verified = verifyAuthToken(token)

    expect(verified).not.toBeNull()
    expect(verified?.uid).toBe(dummyUser.id)
    expect(verified?.loginId).toBe(dummyUser.loginId)
    expect(verified?.role).toBe(dummyUser.role)
    expect(verified?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
  })

  it('should reject tampered token signatures', () => {
    const token = generateAuthToken(dummyUser)
    const [payload, signature] = token.split('.')

    // 改ざんされた署名
    const tamperedSig = signature.slice(0, -2) + 'aa'

    expect(verifyAuthToken(`${payload}.${tamperedSig}`)).toBeNull()
  })

  it('should reject tampered payload (privilege escalation attempt)', () => {
    const token = generateAuthToken(dummyUser)
    const [, signature] = token.split('.')

    // ペイロードのロールを 'admin' に改ざん
    const fakePayload = Buffer.from(
      JSON.stringify({
        uid: dummyUser.id,
        loginId: dummyUser.loginId,
        role: 'admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    ).toString('base64url')

    expect(verifyAuthToken(`${fakePayload}.${signature}`)).toBeNull()
  })

  it('should reject expired tokens', () => {
    // 過去（-10秒前）に期限切れになったトークンを生成
    const expiredToken = generateAuthToken(dummyUser, -10)

    expect(verifyAuthToken(expiredToken)).toBeNull()
  })

  it('should reject malformed or empty tokens', () => {
    expect(verifyAuthToken('')).toBeNull()
    expect(verifyAuthToken('invalid')).toBeNull()
    expect(verifyAuthToken('part1.part2.part3')).toBeNull()
    expect(verifyAuthToken('token_worker1')).toBeNull() // 古い疑似トークン形式は完全拒絶
  })
})

describe('Site Access Authorization (User Requirement: Only master has global site access)', () => {
  const masterUser: SafeUser = {
    id: 'master-id',
    loginId: 'master',
    firstName: '飛鳥',
    lastName: '松田',
    firstNameKana: null,
    lastNameKana: null,
    role: 'admin',
    requirePasswordReset: false,
    email: null,
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignedSiteIds: ['site-a'],
  }

  const subAdminUser: SafeUser = {
    id: 'subadmin-id',
    loginId: 'admin2',
    firstName: 'サブ',
    lastName: '管理者',
    firstNameKana: null,
    lastNameKana: null,
    role: 'admin',
    requirePasswordReset: false,
    email: null,
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignedSiteIds: ['site-a'],
  }

  const workerUser: SafeUser = {
    id: 'worker-id',
    loginId: 'worker1',
    firstName: '太郎',
    lastName: '現場',
    firstNameKana: null,
    lastNameKana: null,
    role: 'worker',
    requirePasswordReset: false,
    email: null,
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignedSiteIds: ['site-a'],
  }

  it('should identify master as superuser and others as non-superuser', () => {
    expect(isSuperUser(masterUser)).toBe(true)
    expect(isSuperUser(subAdminUser)).toBe(false)
    expect(isSuperUser(workerUser)).toBe(false)
  })

  it('should grant master access to ANY site, even unassigned ones', () => {
    expect(canAccessSite(masterUser, 'site-a')).toBe(true)
    expect(canAccessSite(masterUser, 'site-b')).toBe(true)
    expect(canAccessSite(masterUser, 'any-unassigned-site')).toBe(true)
  })

  it('should restrict other admins to only their assigned sites (satisfies "全現場へアクセスできるのはadminではなく私のみ")', () => {
    expect(canAccessSite(subAdminUser, 'site-a')).toBe(true)
    expect(canAccessSite(subAdminUser, 'site-b')).toBe(false)
    expect(canAccessSite(subAdminUser, 'site-c')).toBe(false)
  })

  it('should restrict workers to only their assigned sites', () => {
    expect(canAccessSite(workerUser, 'site-a')).toBe(true)
    expect(canAccessSite(workerUser, 'site-b')).toBe(false)
  })
})
