import type { TableColumn } from '~/types/components'
import type { CableInputItem } from '~/types/tools'

/**
 * 強電ケーブルカテゴリ一覧
 */
export const STRONG_CURRENT_CATEGORIES = [
  'VVF',
  'IV',
  'CV',
  'CVD',
  'CVT',
  '6.6kV CVT',
  'VCTF',
] as const

/**
 * 弱電ケーブルカテゴリ一覧
 */
export const WEAK_CURRENT_CATEGORIES = [
  'CPEV',
  'F-CPEV',
  'HP',
  'AE',
  '同軸',
] as const

/**
 * 配管計算 ケーブルテーブルカラム定義
 */
export const CONDUIT_CABLE_COLUMNS: TableColumn<CableInputItem>[] = [
  { key: 'category', label: 'ケーブル種別' },
  { key: 'cableIdx', label: 'サイズ' },
  { key: 'count', label: '条数', width: '88px', align: 'center' },
  { key: 'spec', subKey: 'specDetail', label: '断面積', width: '96px', align: 'right' },
  { key: 'actions', label: '', width: '52px', align: 'center' },
]

/**
 * ケーブルラック計算 ケーブルテーブルカラム定義
 */
export const RACK_CABLE_COLUMNS: TableColumn<CableInputItem>[] = [
  { key: 'category', label: 'ケーブル種別' },
  { key: 'cableIdx', label: 'サイズ' },
  { key: 'count', label: '条数', width: '88px', align: 'center' },
  { key: 'spec', subKey: 'specDetail', label: '外径計', width: '96px', align: 'right' },
  { key: 'actions', label: '', width: '52px', align: 'center' },
]
