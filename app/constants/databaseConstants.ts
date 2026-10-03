/**
 * 規格データベーステーブル定義定数
 *
 * ケーブル、電線管、ドラム、ラック、トルク等のマスターテーブル表示用カラム定義を提供します。
 */

import type { cableData } from '~/constants/data/cableData'
import type { conduitData } from '~/constants/data/conduitData'
import type { drumData } from '~/constants/data/drumData'
import type { rackData } from '~/constants/data/rackData'
import type { TerminalItem } from '~/constants/data/terminalData'
import type { TableColumn } from '~/types/components'

/**
 * ケーブルDBのテーブルカラム定義
 */
export const CABLE_DB_COLUMNS: TableColumn<(typeof cableData)[number]>[] = [
  { key: 'name', label: 'ケーブル名称', sortable: true },
  { key: 'ampacity', label: '許容電流 (A)', sortable: true, align: 'right' },
  { key: 'diameter', label: '仕上外径 (mm)', sortable: true, align: 'right' },
  {
    key: 'weight',
    label: '概算質量 (kg/m)',
    sortable: true,
    align: 'right',
    format: (v: unknown) => (isNaN(Number(v)) ? (v as string) : Number(v) / 1000),
  },
  {
    key: 'voltage',
    label: '耐電圧',
    sortable: true,
    align: 'center',
    format: (v: unknown) => (v != null ? `${v} V` : '-'),
  },
  {
    key: 'baseTemp',
    label: '基底/最高温度',
    sortable: true,
    align: 'center',
    format: (_: unknown, row: (typeof cableData)[number]) => `${row.baseTemp}℃ / ${row.maxTemp}℃`,
  },
  { key: 'standard', label: '参考規格/メーカー', sortable: true },
]

/**
 * 電線管DBのテーブルカラム定義
 */
export const CONDUIT_DB_COLUMNS: TableColumn<(typeof conduitData)[number]>[] = [
  { key: 'category', label: '配管種類', sortable: true },
  { key: 'size', label: '呼び径', sortable: true, align: 'center' },
  { key: 'innerDiameter', label: '内径 (mm)', sortable: true, align: 'right' },
  { key: 'outerDiameter', label: '外径 (mm)', sortable: true, align: 'right' },
  { key: 'area', label: '断面積 (mm²)', sortable: true, align: 'right' },
  { key: 'standard', label: '規格', sortable: true },
]

/**
 * ケーブルドラムDBのテーブルカラム定義
 */
export const DRUM_DB_COLUMNS: TableColumn<(typeof drumData)[number]>[] = [
  { key: 'category', label: 'カテゴリ', sortable: true },
  { key: 'id', label: 'ドラム記号 (ID)', sortable: true, align: 'center' },
  { key: 'flange_diameter', label: 'ツバ径 (mm)', sortable: true, align: 'right' },
  { key: 'barrel_diameter', label: '胴径 (mm)', sortable: true, align: 'right' },
  { key: 'outer_width', label: '外幅 (mm)', sortable: true, align: 'right' },
  { key: 'inner_width', label: '内幅 (mm)', sortable: true, align: 'right' },
  { key: 'shaft_hole', label: '軸穴径 (mm)', sortable: true, align: 'right' },
  { key: 'weight', label: '空ドラム質量 (kg)', sortable: true, align: 'right' },
]

/**
 * ケーブルラックDBのテーブルカラム定義
 */
export const RACK_DB_COLUMNS: TableColumn<(typeof rackData)[number]>[] = [
  { key: 'category', label: 'カテゴリ', sortable: true },
  { key: 'size', label: 'サイズ (呼び幅 mm)', sortable: true, align: 'right' },
  { key: 'height', label: '親桁高さ (mm)', sortable: true, align: 'right' },
  { key: 'weightPiece', label: '1本あたり質量 (kg/3m)', sortable: true, align: 'right' },
  { key: 'weightMeter', label: '1mあたり質量 (kg/m)', sortable: true, align: 'right' },
]

/**
 * 締付トルクアイテム型
 */
export interface TorqueDbItem {
  category: string
  reference: string
  size: string
  torque_nm: number | string
  range_nm: string
  note: string
}

/**
 * 締付トルクDBのテーブルカラム定義
 */
export const TORQUE_DB_COLUMNS: TableColumn<TorqueDbItem>[] = [
  { key: 'category', label: 'カテゴリ', sortable: true },
  { key: 'size', label: 'サイズ', sortable: true, align: 'center' },
  { key: 'torque_nm', label: '標準トルク (N・m)', sortable: true, align: 'right' },
  { key: 'range_nm', label: '許容範囲 (N・m)', sortable: true, align: 'right' },
  { key: 'note', label: '備考', sortable: true },
  { key: 'reference', label: '参考規格', sortable: true },
]

/**
 * 裸圧着端子（R形）DBのテーブルカラム定義
 */
export const TERMINAL_DB_COLUMNS: TableColumn<TerminalItem>[] = [
  { key: 'name', label: '品番・呼称', sortable: true },
  { key: 'category', label: '公称断面積', sortable: true, align: 'center' },
  { key: 'stud', label: 'ねじ径', sortable: true, align: 'center' },
  {
    key: 'holeDia',
    label: '穴径 d2 (mm)',
    sortable: true,
    align: 'right',
    format: (v: unknown) => `${Number(v).toFixed(1)} mm`,
  },
  {
    key: 'widthB',
    label: '舌部幅 B (mm)',
    sortable: true,
    align: 'right',
    format: (v: unknown) => `${Number(v).toFixed(1)} mm`,
  },
  {
    key: 'lengthL',
    label: '全長 L (mm)',
    sortable: true,
    align: 'right',
    format: (v: unknown) => `${Number(v).toFixed(1)} mm`,
  },
  {
    key: 'innerDiaD1',
    label: '内径 d1 (mm)',
    sortable: true,
    align: 'right',
    format: (v: unknown) => `${Number(v).toFixed(1)} mm`,
  },
  {
    key: 'wireRangeStranded',
    label: '電線抱合範囲',
    sortable: true,
    align: 'center',
    format: (_: unknown, row: TerminalItem) =>
      row.wireRangeSolid
        ? `${row.wireRangeStranded} mm² (単線 Φ${row.wireRangeSolid})`
        : `${row.wireRangeStranded} mm²`,
  },
  { key: 'standard', label: '規格区分', sortable: true, align: 'center' },
]
