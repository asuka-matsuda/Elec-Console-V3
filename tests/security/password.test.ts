import crypto from 'crypto'
import { describe, expect, it } from 'vitest'

import {
  generateRandomPassword,
  hashPassword,
  needsRehash,
  verifyPassword,
} from '../../server/utils/password'

describe('Password Security & Hashing', () => {
  it('should hash password with PBKDF2 100,000 iterations format', () => {
    const raw = 'SecureP@ssw0rd123'
    const hashed = hashPassword(raw)

    expect(hashed).toMatch(/^pbkdf2:100000:[a-f0-9]{32}:[a-f0-9]{128}$/)
  })

  it('should verify password against new hash format', () => {
    const raw = 'MySecretP@ssword!'
    const hashed = hashPassword(raw)

    expect(verifyPassword(raw, hashed)).toBe(true)
    expect(verifyPassword('WrongPassword', hashed)).toBe(false)
    expect(verifyPassword('', hashed)).toBe(false)
  })

  it('should verify password against legacy 10,000 iterations format for backward compatibility', () => {
    // レガシー形式 (salt:hash / 10,000回)
    const salt = 'd1a7af74fccd08d47d80ac45a4397a97'
    const originalHash = crypto.pbkdf2Sync('legacyPassword123', salt, 10000, 64, 'sha512').toString('hex')
    const legacyHash = `${salt}:${originalHash}`

    expect(verifyPassword('legacyPassword123', legacyHash)).toBe(true)
    expect(verifyPassword('wrong', legacyHash)).toBe(false)
  })

  it('should detect when a legacy hash needs to be upgraded', () => {
    const legacyHash = 'salt:hash'
    const modernHash = hashPassword('test')

    expect(needsRehash(legacyHash)).toBe(true)
    expect(needsRehash('pbkdf2:10000:salt:hash')).toBe(true)
    expect(needsRehash(modernHash)).toBe(false)
  })

  it('should handle malformed or corrupted hashes safely without crashing', () => {
    expect(verifyPassword('password', '')).toBe(false)
    expect(verifyPassword('password', 'invalid')).toBe(false)
    expect(verifyPassword('password', 'pbkdf2:abc:salt:hash')).toBe(false)
    expect(verifyPassword('password', 'pbkdf2:100000::')).toBe(false)
  })

  it('should generate strong random passwords with specified length', () => {
    const pwd1 = generateRandomPassword(8)
    const pwd2 = generateRandomPassword(16)

    expect(pwd1.length).toBe(8)
    expect(pwd2.length).toBe(16)
    expect(pwd1).not.toBe(pwd2)
    // まぎらわしい文字が含まれていないこと
    expect(pwd1).not.toMatch(/[l1IO0]/)
  })
})
