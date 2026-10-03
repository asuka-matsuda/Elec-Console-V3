import { describe, expect, it } from 'vitest'

import { formatUserFullName, formatUserKana } from '../../app/utils/user'

describe('app/utils/user.ts', () => {
  describe('formatUserFullName', () => {
    it('姓と名が設定されている場合、半角スペース区切りで結合すること', () => {
      expect(formatUserFullName({ lastName: '松田', firstName: '飛鳥' })).toBe('松田 飛鳥')
    })

    it('姓のみ設定されている場合、トリムされて姓のみ返ること', () => {
      expect(formatUserFullName({ lastName: '松田', firstName: '' })).toBe('松田')
    })

    it('名のみ設定されている場合、トリムされて名のみ返ること', () => {
      expect(formatUserFullName({ lastName: '', firstName: '飛鳥' })).toBe('飛鳥')
    })

    it('両方空または空白の場合、「（未設定）」が返ること', () => {
      expect(formatUserFullName({ lastName: '', firstName: '' })).toBe('（未設定）')
      expect(formatUserFullName({ lastName: '  ', firstName: ' ' })).toBe('（未設定）')
    })

    it('引数がnullまたはundefinedの場合、「（未設定）」が返ること', () => {
      expect(formatUserFullName(null)).toBe('（未設定）')
      expect(formatUserFullName(undefined)).toBe('（未設定）')
    })
  })

  describe('formatUserKana', () => {
    it('姓カナと名カナが設定されている場合、半角スペース区切りで結合すること', () => {
      expect(formatUserKana({ lastNameKana: 'まつだ', firstNameKana: 'あすか' })).toBe('まつだ あすか')
    })

    it('片方のみ設定されている場合、トリムされてその値のみ返ること', () => {
      expect(formatUserKana({ lastNameKana: 'まつだ', firstNameKana: '' })).toBe('まつだ')
      expect(formatUserKana({ lastNameKana: '', firstNameKana: 'あすか' })).toBe('あすか')
    })

    it('両方空または未設定の場合、空文字が返ること', () => {
      expect(formatUserKana({ lastNameKana: '', firstNameKana: '' })).toBe('')
      expect(formatUserKana(null)).toBe('')
      expect(formatUserKana(undefined)).toBe('')
    })
  })
})
