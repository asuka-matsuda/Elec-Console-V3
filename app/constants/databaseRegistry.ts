/**
 * 規格データベースレジストリ
 *
 * ケーブル・電線管・ドラム・ケーブルラック・締付トルクの各規格マスターデータを
 * テーブル表示および検索機能と紐付けるレジストリ設定を定義します。
 */

import { cableData } from '~/constants/data/cableData'
import { conduitData } from '~/constants/data/conduitData'
import { drumData } from '~/constants/data/drumData'
import { rackData } from '~/constants/data/rackData'
import { torqueDbData } from '~/constants/data/torqueData'
import {
  CABLE_DB_COLUMNS,
  CONDUIT_DB_COLUMNS,
  DRUM_DB_COLUMNS,
  RACK_DB_COLUMNS,
  TORQUE_DB_COLUMNS,
  type TorqueDbItem,
} from '~/constants/databaseConstants'
import type { TableColumn } from '~/types/components'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface DatabaseConfig<T = any> {
  title: string
  data: T[]
  columns: TableColumn<T>[]
  searchMapper: (item: T) => string
  placeholder: string
}

export const DATABASE_REGISTRY: Record<string, DatabaseConfig> = {
  'cable-db': {
    title: 'ケーブル規格',
    data: cableData,
    columns: CABLE_DB_COLUMNS,
    searchMapper: (item: (typeof cableData)[number]) => `${item.name} ${item.standard || ''}`,
    placeholder: '種類、サイズなどを検索... (例: CVT 22)',
  },
  'conduit-db': {
    title: '配管規格',
    data: conduitData,
    columns: CONDUIT_DB_COLUMNS,
    searchMapper: (item: (typeof conduitData)[number]) => `${item.category} ${item.size} ${item.standard || ''}`,
    placeholder: '種類、サイズなどを検索... (例: G22)',
  },
  'drum-db': {
    title: 'ケーブルドラム規格',
    data: drumData,
    columns: DRUM_DB_COLUMNS,
    searchMapper: (item: (typeof drumData)[number]) => `${item.category} ${item.id}`,
    placeholder: '種類、サイズなどを検索... (例: L1)',
  },
  'rack-db': {
    title: 'ケーブルラック規格',
    data: rackData,
    columns: RACK_DB_COLUMNS,
    searchMapper: (item: (typeof rackData)[number]) => `${item.category} ${item.size}`,
    placeholder: '種類、サイズなどを検索... (例: SR 300)',
  },
  'torque-db': {
    title: '締付トルク一覧表',
    data: torqueDbData,
    columns: TORQUE_DB_COLUMNS,
    searchMapper: (item: TorqueDbItem) => `${item.category} ${item.size} ${item.note || ''} ${item.reference || ''}`,
    placeholder: '種類、サイズなどを検索... (例: M8)',
  },
}
