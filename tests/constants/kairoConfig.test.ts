import { describe, expect, it } from 'vitest'

import { KAIRO_SYMBOL_MAP, resolveKairoSymbol } from '../../app/constants/kairoConfig'

describe('kairoConfig.ts', () => {
  it('resolves circle symbols correctly', () => {
    expect(resolveKairoSymbol('丸')).toEqual({ type: 'circle' })
    expect(resolveKairoSymbol('○')).toEqual({ type: 'circle' })
    expect(resolveKairoSymbol('〇')).toEqual({ type: 'circle' })
    expect(resolveKairoSymbol('二重丸')).toEqual({ type: 'circle', isDouble: true })
    expect(resolveKairoSymbol('◎')).toEqual({ type: 'circle', isDouble: true })
  })

  it('resolves ellipse symbols correctly', () => {
    expect(resolveKairoSymbol('楕円')).toEqual({ type: 'ellipse' })
    expect(resolveKairoSymbol('二重楕円')).toEqual({ type: 'ellipse', isDouble: true })
  })

  it('resolves rect symbols correctly', () => {
    expect(resolveKairoSymbol('四角')).toEqual({ type: 'rect' })
    expect(resolveKairoSymbol('□')).toEqual({ type: 'rect' })
    expect(resolveKairoSymbol('二重四角')).toEqual({ type: 'rect', isDouble: true })
  })

  it('resolves polygon symbols correctly', () => {
    expect(resolveKairoSymbol('三角')?.type).toBe('polygon')
    expect(resolveKairoSymbol('二重三角')?.isDouble).toBe(true)
    expect(resolveKairoSymbol('菱形')?.type).toBe('polygon')
    expect(resolveKairoSymbol('六角形')?.type).toBe('polygon')
  })

  it('trims whitespace and handles undefined/null/unknown inputs', () => {
    expect(resolveKairoSymbol('  ◎  ')).toEqual({ type: 'circle', isDouble: true })
    expect(resolveKairoSymbol(null)).toBeNull()
    expect(resolveKairoSymbol(undefined)).toBeNull()
    expect(resolveKairoSymbol('')).toBeNull()
    expect(resolveKairoSymbol('未知の記号')).toBeNull()
  })

  it('exports KAIRO_SYMBOL_MAP dictionary', () => {
    expect(Object.keys(KAIRO_SYMBOL_MAP).length).toBeGreaterThan(0)
  })
})
