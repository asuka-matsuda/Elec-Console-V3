import { beforeEach, describe, expect, it } from 'vitest'

import { useNoBreakWords } from '~/composables/useNoBreakWords'
import { joinWithWordJoiner, NO_BREAK_HYPHEN, WORD_JOINER } from '~/utils/noBreak'

describe('useNoBreakWords / joinWithWordJoiner', () => {
  it('文字数が1文字以下の場合はそのまま返す', () => {
    expect(joinWithWordJoiner('')).toBe('')
    expect(joinWithWordJoiner('A')).toBe('A')
    expect(joinWithWordJoiner('盤')).toBe('盤')
  })

  it('2文字以上の文字列の間に Word Joiner (\\u2060) を挿入する', () => {
    const result = joinWithWordJoiner('自動倉庫')

    expect(result).toBe(`自${WORD_JOINER}動${WORD_JOINER}倉${WORD_JOINER}庫`)
  })

  it('既に Word Joiner が含まれていても二重挿入されない', () => {
    const original = `自${WORD_JOINER}動`
    const result = joinWithWordJoiner(original)

    expect(result).toBe(`自${WORD_JOINER}動`)
  })
})

describe('useNoBreakWords / applyNoBreak', () => {
  const { applyNoBreak, words } = useNoBreakWords()

  beforeEach(() => {
    words.value = []
  })

  it('非文字列や空文字はそのまま返す', () => {
    expect(applyNoBreak(null)).toBe(null)
    expect(applyNoBreak(undefined)).toBe(undefined)
    expect(applyNoBreak(123)).toBe(123)
    expect(applyNoBreak('')).toBe('')
  })

  it('初期自動ルール: 〇-〇 パターンが改行禁止ハイフンとWord Joinerで結合される', () => {
    const text = '盤 1-1 です'
    const result = applyNoBreak(text) as string

    expect(result).toContain(`1${WORD_JOINER}${NO_BREAK_HYPHEN}${WORD_JOINER}1`)
  })

  it('初期自動ルール: 〇〇盤 パターンが自動でWord Joiner結合される', () => {
    const text = '分電盤の点検'
    const result = applyNoBreak(text) as string

    expect(result).toContain(`分${WORD_JOINER}電${WORD_JOINER}盤`)

    const text2 = '動力盤 1L-1'
    const result2 = applyNoBreak(text2) as string

    expect(result2).toContain(`動${WORD_JOINER}力${WORD_JOINER}盤`)
    expect(result2).toContain(`1${WORD_JOINER}L${WORD_JOINER}${NO_BREAK_HYPHEN}${WORD_JOINER}1`)
  })

  it('手動登録ワードが指定された場合、その単語もWord Joiner結合される', () => {
    words.value = ['自動倉庫', '受変電設備']
    const text = '自動倉庫 1-1（受変電設備）'
    const result = applyNoBreak(text) as string

    expect(result).toContain(`自${WORD_JOINER}動${WORD_JOINER}倉${WORD_JOINER}庫`)
    expect(result).toContain(`受${WORD_JOINER}変${WORD_JOINER}電${WORD_JOINER}設${WORD_JOINER}備`)
  })

  it('登録されていない普通の単語は改行禁止化されない', () => {
    words.value = ['自動倉庫']
    const text = '事務所照明'
    const result = applyNoBreak(text) as string

    expect(result).toBe('事務所照明')
  })

  it('現場IDごとに個別の改行禁止辞書を保持できる', () => {
    const siteA = useNoBreakWords('site-alpha')
    const siteB = useNoBreakWords('site-beta')

    siteA.words.value = ['自動倉庫']
    siteB.words.value = ['受変電設備']

    expect(siteA.words.value).toEqual(['自動倉庫'])
    expect(siteB.words.value).toEqual(['受変電設備'])

    const textAlpha = siteA.applyNoBreak('自動倉庫と受変電設備') as string

    expect(textAlpha).toContain(`自${WORD_JOINER}動${WORD_JOINER}倉${WORD_JOINER}庫`)
    // siteA では「受変電設備」は結合されない
    expect(textAlpha).not.toContain(`受${WORD_JOINER}変${WORD_JOINER}電`)

    const textBeta = siteB.applyNoBreak('自動倉庫と受変電設備') as string

    expect(textBeta).toContain(`受${WORD_JOINER}変${WORD_JOINER}電${WORD_JOINER}設${WORD_JOINER}備`)
    // siteB では「自動倉庫」は結合されない
    expect(textBeta).not.toContain(`自${WORD_JOINER}動${WORD_JOINER}倉`)
  })
})
