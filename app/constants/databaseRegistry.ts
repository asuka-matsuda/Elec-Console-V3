/**
 * 規格データベースレジストリ（遅延ローダー版）
 *
 * ケーブル・電線管・ドラム・ケーブルラック・締付トルク等の各規格マスターデータを
 * 必要な時だけオンデマンドでロード（Code Splitting）し、初期バンドルサイズを大幅に削減します。
 */

import type { TerminalItem } from '~/constants/data/terminalData'
import {
  CABLE_DB_COLUMNS,
  CONDUIT_DB_COLUMNS,
  DRUM_DB_COLUMNS,
  RACK_DB_COLUMNS,
  TERMINAL_DB_COLUMNS,
  TORQUE_DB_COLUMNS,
  type TorqueDbItem,
} from '~/constants/databaseConstants'
import type { TableColumn } from '~/types/components'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface DatabaseConfig<T = any> {
  title: string
  data: T[]
  columns: TableColumn<T>[]
  searchMapper: (item: T) => string
  placeholder: string
}

export const DATABASE_KEYS = [
  'cable-db',
  'conduit-db',
  'drum-db',
  'rack-db',
  'torque-db',
  'terminal-db',
] as const

export type DatabaseKey = (typeof DATABASE_KEYS)[number]

export type DatabaseLoader = () => Promise<DatabaseConfig>

export const DATABASE_LOADERS: Record<DatabaseKey, DatabaseLoader> = {
  'cable-db': async () => {
    const { cableData } = await import('./data/cableData')

    return {
      title: 'ケーブル規格',
      data: cableData,
      columns: CABLE_DB_COLUMNS,
      searchMapper: (item: (typeof cableData)[number]) => `${item.name} ${item.standard || ''}`,
      placeholder: '種類、サイズなどを検索... (例: CVT 22)',
    }
  },
  'conduit-db': async () => {
    const { conduitData } = await import('./data/conduitData')

    return {
      title: '配管規格',
      data: conduitData,
      columns: CONDUIT_DB_COLUMNS,
      searchMapper: (item: (typeof conduitData)[number]) => `${item.category} ${item.size} ${item.standard || ''}`,
      placeholder: '種類、サイズなどを検索... (例: G22)',
    }
  },
  'drum-db': async () => {
    const { drumData } = await import('./data/drumData')

    return {
      title: 'ケーブルドラム規格',
      data: drumData,
      columns: DRUM_DB_COLUMNS,
      searchMapper: (item: (typeof drumData)[number]) => `${item.category} ${item.id}`,
      placeholder: '種類、サイズなどを検索... (例: L1)',
    }
  },
  'rack-db': async () => {
    const { rackData } = await import('./data/rackData')

    return {
      title: 'ケーブルラック規格',
      data: rackData,
      columns: RACK_DB_COLUMNS,
      searchMapper: (item: (typeof rackData)[number]) => `${item.category} ${item.size}`,
      placeholder: '種類、サイズなどを検索... (例: SR 300)',
    }
  },
  'torque-db': async () => {
    const { torqueDbData } = await import('./data/torqueData')

    return {
      title: '締付トルク一覧表',
      data: torqueDbData,
      columns: TORQUE_DB_COLUMNS,
      searchMapper: (item: TorqueDbItem) => `${item.category} ${item.size} ${item.note || ''} ${item.reference || ''}`,
      placeholder: '種類、サイズなどを検索... (例: M8)',
    }
  },
  'terminal-db': async () => {
    const { terminalData } = await import('./data/terminalData')

    return {
      title: '端子規格 (R形)',
      data: terminalData,
      columns: TERMINAL_DB_COLUMNS,
      searchMapper: (item: TerminalItem) =>
        `${item.name} ${item.category} ${item.stud} ${item.standard} ${item.wireRangeStranded}`,
      placeholder: '品番、サイズ、ねじ径などを検索... (例: R5.5-5, M4, S4)',
    }
  },
}

/**
 * 指定されたキーに対応するデータベース設定を非同期でロードします。
 */
export async function loadDatabaseConfig(key: string): Promise<DatabaseConfig | null> {
  const loader = DATABASE_LOADERS[key as DatabaseKey]

  if (!loader) {
    return null
  }

  return await loader()
}
