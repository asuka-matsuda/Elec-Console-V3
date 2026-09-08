import type { cableData } from '~/constants/data/cableData'
import type { conduitData } from '~/constants/data/conduitData'
import type { drumData } from '~/constants/data/drumData'
import type { rackData } from '~/constants/data/rackData'
import type { TableColumn } from '~/types/components'

/**
 * ケーブルDBのテーブルカラム定義
 */
export const CABLE_DB_COLUMNS: TableColumn<(typeof cableData)[number]>[] = [
  { key: 'name', label: 'ケーブル名称', sortable: true },
  { key: 'ampacity', label: '許容電流 (A)', sortable: true },
  { key: 'diameter', label: '仕上外径 (mm)', sortable: true },
  { key: 'weight', label: '概算質量 (kg/m)', sortable: true },
  { key: 'voltage', label: '耐電圧', sortable: true },
  { key: 'temp', label: '基底/最高温度', sortable: true },
  { key: 'standard', label: '参考規格/メーカー', sortable: true },
]

/**
 * 電線管DBのテーブルカラム定義
 */
export const CONDUIT_DB_COLUMNS: TableColumn<(typeof conduitData)[number]>[] = [
  { key: 'category', label: '配管種類', sortable: true },
  { key: 'size', label: '呼び径', sortable: true },
  { key: 'innerDiameter', label: '内径 (mm)', sortable: true },
  { key: 'outerDiameter', label: '外径 (mm)', sortable: true },
  { key: 'area', label: '断面積 (mm²)', sortable: true },
  { key: 'standard', label: '規格', sortable: true },
]

/**
 * ケーブルドラムDBのテーブルカラム定義
 */
export const DRUM_DB_COLUMNS: TableColumn<(typeof drumData)[number]>[] = [
  { key: 'category', label: 'カテゴリ', sortable: true },
  { key: 'id', label: 'ドラム記号 (ID)', sortable: true },
  { key: 'flange_diameter', label: 'ツバ径 (mm)', sortable: true },
  { key: 'barrel_diameter', label: '胴径 (mm)', sortable: true },
  { key: 'outer_width', label: '外幅 (mm)', sortable: true },
  { key: 'inner_width', label: '内幅 (mm)', sortable: true },
  { key: 'shaft_hole', label: '軸穴径 (mm)', sortable: true },
  { key: 'weight', label: '空ドラム質量 (kg)', sortable: true },
]

/**
 * ケーブルラックDBのテーブルカラム定義
 */
export const RACK_DB_COLUMNS: TableColumn<(typeof rackData)[number]>[] = [
  { key: 'category', label: 'カテゴリ', sortable: true },
  { key: 'size', label: 'サイズ (呼び幅 mm)', sortable: true },
  { key: 'height', label: '親桁高さ (mm)', sortable: true },
  { key: 'weightPiece', label: '1本あたり質量 (kg/3m)', sortable: true },
  { key: 'weightMeter', label: '1mあたり質量 (kg/m)', sortable: true },
]

/**
 * 締付トルクアイテム型
 */
export interface TorqueDbItem {
  category: string
  reference: string
  size: string
  torque_nm: string
  range_nm: string
  note: string
}

/**
 * 締付トルクDBのテーブルカラム定義
 */
export const TORQUE_DB_COLUMNS: TableColumn<TorqueDbItem>[] = [
  { key: 'category', label: 'カテゴリ', sortable: true },
  { key: 'size', label: 'サイズ', sortable: true },
  { key: 'torque_nm', label: '標準トルク (N・m)', sortable: true },
  { key: 'range_nm', label: '許容範囲 (N・m)', sortable: true },
  { key: 'note', label: '備考', sortable: true },
  { key: 'reference', label: '参考規格', sortable: true },
]
