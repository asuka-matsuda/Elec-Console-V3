/**
 * @fileoverview System Data Master
 * 電気方式（相・線式）マスターデータ。
 * 各方式の計算用パラメータ定義、表示タグ管理、およびUI連携用のデータを保持します。
 */

export const systemData = [
  {
    id: '1P2W100',
    label: '単相2線式 100V',
    voltage: 100,
    kwDivisor: 100,
    simpleK: 35.6,
  },
  {
    id: '1P2W200',
    label: '単相2線式 200V',
    voltage: 200,
    kwDivisor: 200,
    simpleK: 35.6,
  },
  {
    id: '1P3W200',
    label: '単相3線式 100/200V',
    voltage: 100,
    kwDivisor: 200,
    simpleK: 17.8,
  },
  {
    id: '3P3W200',
    label: '三相3線式 200V',
    voltage: 200,
    kwDivisor: 200 * 1.732,
    simpleK: 30.8,
  },
  {
    id: '3P3W400',
    label: '三相3線式 400V',
    voltage: 400,
    kwDivisor: 400 * 1.732,
    simpleK: 30.8,
  },
]
