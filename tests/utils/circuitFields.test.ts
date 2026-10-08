import { describe, expect, it } from 'vitest'

import {
  CIRCUIT_FIELD_ALIASES,
  extractBanMeisho,
  extractBanShubetsu,
  extractKairoBangou,
  extractKairoMeisho,
  extractKansenHantei,
  extractKeiToName,
  findMatchingColumnIndex,
} from '~~/shared/utils/circuitFields'

describe('circuitFields (SSoT抽出ロジック)', () => {
  it('配電盤MCCBNo.があっても盤名称を正確に抽出できること', () => {
    const row = {
      配電盤MCCBNo: '10',
      盤種別: '電灯盤',
      盤名称: '1L-1',
      系統名: '電灯系',
      幹線判定: '二次側',
      回路番号: '1-1',
      負荷名称: '1F事務室照明',
    }

    expect(extractBanMeisho(row)).toBe('1L-1')
    expect(extractBanShubetsu(row)).toBe('電灯盤')
    expect(extractKeiToName(row)).toBe('電灯系')
    expect(extractKansenHantei(row)).toBe('二次')
    expect(extractKairoBangou(row)).toBe('1-1')
    expect(extractKairoMeisho(row)).toBe('1F事務室照明')
  })

  it('完全一致列が存在しない場合、安全なフォールバックで抽出できること', () => {
    const row = {
      分電盤名称: '2P-1',
      種別: '動力盤',
      系統: '動力幹線',
    }

    expect(extractBanMeisho(row)).toBe('2P-1')
    expect(extractBanShubetsu(row)).toBe('動力盤')
    expect(extractKeiToName(row)).toBe('動力幹線')
    expect(extractKansenHantei(row)).toBe('幹線')
  })

  it('除外語を含む列（盤番号、盤サイズなど）を盤名称として誤検知しないこと', () => {
    const row = {
      盤番号: '5',
      盤MCCB: '50A',
    }

    // 盤名称がない場合は fallback（未分類）
    expect(extractBanMeisho(row)).toBe('未分類')
  })

  it('findMatchingColumnIndex で完全一致列インデックスを優先検知すること', () => {
    const headers = [
      { name: 'No.', colIndex: 1 },
      { name: '配電盤MCCBNo.', colIndex: 4 },
      { name: '盤名称', colIndex: 6 },
      { name: '盤種別', colIndex: 7 },
    ]

    const banIndex = findMatchingColumnIndex(headers, CIRCUIT_FIELD_ALIASES.banMeisho)

    expect(banIndex).toBe(6)

    const shubetsuIndex = findMatchingColumnIndex(headers, CIRCUIT_FIELD_ALIASES.banShubetsu)

    expect(shubetsuIndex).toBe(7)
  })
})
