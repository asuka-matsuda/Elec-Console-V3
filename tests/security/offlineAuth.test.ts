import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from '../../app/composables/useAuth'
import { generateSalt, hashPasswordClient, verifyPasswordClient } from '../../app/utils/crypto'
import { AuthCacheRepository } from '../../app/utils/db'

describe('Offline Authentication (Web Crypto API & Local-First)', () => {
  beforeEach(async () => {
    // IndexedDB のテスト用クリーンアップ
    await AuthCacheRepository.delete('test-worker')
    // オフライン状態をシミュレート
    vi.stubGlobal('navigator', { onLine: false })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('generates salt and computes PBKDF2 hash correctly', async () => {
    const salt = generateSalt(16)

    expect(salt).toHaveLength(32) // 16 bytes = 32 hex chars

    const hash = await hashPasswordClient('secret123', salt)

    expect(hash).toHaveLength(64) // 256 bits = 64 hex chars

    // 同じソルト・同じパスワードなら同一ハッシュ
    const hash2 = await hashPasswordClient('secret123', salt)

    expect(hash).toBe(hash2)

    // 異なるパスワードなら異なるハッシュ
    const hashOther = await hashPasswordClient('different-pwd', salt)

    expect(hash).not.toBe(hashOther)
  })

  it('verifies correct and incorrect passwords', async () => {
    const salt = generateSalt(16)
    const hash = await hashPasswordClient('correct-pass', salt)

    const isMatch = await verifyPasswordClient('correct-pass', salt, hash)

    expect(isMatch).toBe(true)

    const isMismatch = await verifyPasswordClient('wrong-pass', salt, hash)

    expect(isMismatch).toBe(false)
  })

  it('authenticates offline when valid cached credentials exist', async () => {
    const salt = generateSalt(16)
    const hash = await hashPasswordClient('offline-pass', salt)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

    // 事前キャッシュを登録
    await AuthCacheRepository.put({
      loginId: 'test-worker',
      user: {
        id: 'u-1',
        loginId: 'test-worker',
        role: 'worker',
        firstName: '太郎',
        lastName: '現場',
        isActive: true,
        assignedSiteIds: ['site-01'],
      },
      passwordSalt: salt,
      passwordHash: hash,
      cachedAt: now.toISOString(),
      expiresAt,
    })

    const { login, currentUser, isOfflineSession, isAuthenticated } = useAuth()

    // 正しいパスワードでオフラインログイン
    const result = await login('test-worker', 'offline-pass')

    expect(result.success).toBe(true)
    expect(isOfflineSession.value).toBe(true)
    expect(currentUser.value?.loginId).toBe('test-worker')
    expect(isAuthenticated.value).toBe(true)

    // 不正なパスワードでのオフラインログイン試行
    const failResult = await login('test-worker', 'wrong-pass')

    expect(failResult.success).toBe(false)
    expect(failResult.message).toContain('パスワードが違います')
  })

  it('rejects offline login for unknown users not cached', async () => {
    const { login } = useAuth()

    const result = await login('unknown-user', 'any-pass')

    expect(result.success).toBe(false)
    expect(result.message).toContain('事前にオンラインで一度ログインしたアカウントのみ利用できます')
  })

  it('restores serverTimeOffset and accurate time on offline authentication', async () => {
    const salt = generateSalt(16)
    const hash = await hashPasswordClient('offline-pass', salt)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const simulatedOffsetMs = 5000 // 5秒のサーバー時刻オフセット

    await AuthCacheRepository.put({
      loginId: 'test-worker',
      user: {
        id: 'u-1',
        loginId: 'test-worker',
        role: 'worker',
        firstName: '太郎',
        lastName: '現場',
        isActive: true,
        assignedSiteIds: ['site-01'],
      },
      passwordSalt: salt,
      passwordHash: hash,
      cachedAt: now.toISOString(),
      expiresAt,
      serverTimeOffset: simulatedOffsetMs,
    })

    const { login, getAccurateNow } = useAuth()

    const result = await login('test-worker', 'offline-pass')

    expect(result.success).toBe(true)

    // getAccurateNow() が Date.now() + 5000ms 付近を指すことを確認
    const accurateTime = getAccurateNow().getTime()
    const localTime = Date.now()

    expect(accurateTime - localTime).toBeGreaterThanOrEqual(4900)
    expect(accurateTime - localTime).toBeLessThanOrEqual(5100)
  })
})
