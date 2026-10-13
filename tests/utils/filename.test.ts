import { describe, expect, it } from 'vitest'

import { sanitizeFilename } from '../../shared/utils/filename'

describe('sanitizeFilename', () => {
  it('replaces forbidden OS characters with underscore', () => {
    expect(sanitizeFilename('site/name:with*bad?chars"and<arrows>|pipe')).toBe('site_name_with_bad_chars_and_arrows__pipe')
    expect(sanitizeFilename('path\\with\\backslashes')).toBe('path_with_backslashes')
  })

  it('preserves valid filenames', () => {
    expect(sanitizeFilename('現場A_試験結果_20261014.xlsx')).toBe('現場A_試験結果_20261014.xlsx')
  })

  it('uses fallback when input is empty or null', () => {
    expect(sanitizeFilename(null)).toBe('ファイル')
    expect(sanitizeFilename('')).toBe('ファイル')
    expect(sanitizeFilename(undefined, 'デフォルト')).toBe('デフォルト')
  })
})
