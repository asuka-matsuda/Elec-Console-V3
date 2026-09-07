import { beforeEach, describe, expect, it } from 'vitest'

import {
  checkRateLimit,
  clearRateLimit,
  recordFailedAttempt,
  resetAllRateLimits,
} from '../../server/utils/rateLimit'

describe('Login Rate Limiter (Brute-force Protection)', () => {
  const testKey = 'login:127.0.0.1:testuser'

  beforeEach(() => {
    resetAllRateLimits()
  })

  it('should allow initial attempts', () => {
    const status = checkRateLimit(testKey)

    expect(status.isBlocked).toBe(false)
    expect(status.attemptsLeft).toBe(5)
  })

  it('should decrease remaining attempts on failed login', () => {
    recordFailedAttempt(testKey)
    let status = checkRateLimit(testKey)

    expect(status.isBlocked).toBe(false)
    expect(status.attemptsLeft).toBe(4)

    recordFailedAttempt(testKey)
    status = checkRateLimit(testKey)
    expect(status.attemptsLeft).toBe(3)
  })

  it('should block after 5 failed attempts within window', () => {
    for (let i = 0; i < 4; i++) {
      const res = recordFailedAttempt(testKey)

      expect(res.isBlocked).toBe(false)
    }

    // 5回目でブロック
    const fifth = recordFailedAttempt(testKey)

    expect(fifth.isBlocked).toBe(true)
    expect(fifth.remainingMs).toBeGreaterThan(0)

    // チェック時もブロック判定
    const status = checkRateLimit(testKey)

    expect(status.isBlocked).toBe(true)
    expect(status.attemptsLeft).toBe(0)
  })

  it('should clear rate limit on successful login', () => {
    recordFailedAttempt(testKey)
    recordFailedAttempt(testKey)
    expect(checkRateLimit(testKey).attemptsLeft).toBe(3)

    clearRateLimit(testKey)
    expect(checkRateLimit(testKey).attemptsLeft).toBe(5)
    expect(checkRateLimit(testKey).isBlocked).toBe(false)
  })
})
