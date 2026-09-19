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
} from '~/constants/databaseConstants'
import type { TableColumn } from '~/types/components'

export interface DatabaseConfig<T = Record<string, unknown>> {
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
    searchMapper: item => `${item.name} ${item.standard || ''}`,
    placeholder: '種類、サイズなどを検索... (例: CVT 22)',
  },
  'conduit-db': {
    title: '配管規格',
    data: conduitData,
    columns: CONDUIT_DB_COLUMNS,
    searchMapper: item => `${item.category} ${item.size} ${item.standard || ''}`,
    placeholder: '種類、サイズなどを検索... (例: G22)',
  },
  'drum-db': {
    title: 'ケーブルドラム規格',
    data: drumData,
    columns: DRUM_DB_COLUMNS,
    searchMapper: item => `${item.category} ${item.id}`,
    placeholder: '種類、サイズなどを検索... (例: L1)',
  },
  'rack-db': {
    title: 'ケーブルラック規格',
    data: rackData,
    columns: RACK_DB_COLUMNS,
    searchMapper: item => `${item.category} ${item.size}`,
    placeholder: '種類、サイズなどを検索... (例: SR 300)',
  },
  'torque-db': {
    title: '締付トルク一覧表',
    data: torqueDbData,
    columns: TORQUE_DB_COLUMNS,
    searchMapper: item => `${item.category} ${item.size} ${item.note || ''} ${item.reference || ''}`,
    placeholder: '種類、サイズなどを検索... (例: M8)',
  },
}
