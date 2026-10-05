/**
 * ナビゲーションメニュー構造データ
 *
 * グローバルナビゲーションおよびダッシュボードで使用される
 * カテゴリ別メニュー（現場管理、電卓ツール、データベース、規約解説等）の定義です。
 */

import type { IconName } from '~/constants/icons'
import type { BadgeVariant } from '~/types/components'

export interface MenuBadge {
  text: string
  color?: string
  variant?: BadgeVariant
}

export type MenuItem = {
  id?: string
  text: string
  href: string
  icon: IconName
  activePrefixes?: string[]
  desc?: string
  disabled?: boolean
  masterOnly?: boolean
  version?: string
  badge?: MenuBadge | string
}

export type MenuSection = {
  id: string
  heading?: string
  globalNavHeading?: string
  icon?: IconName
  accent?: 'tool' | 'database' | 'reference' | 'management' | 'main'
  items: MenuItem[]
  showInDashboard: boolean
}

export const menuData: MenuSection[] = [
  {
    id: 'home',
    items: [{ id: 'home', text: 'ホーム', href: '/', icon: 'home' }],
    showInDashboard: false,
  },
  {
    id: 'management',
    heading: '現場管理',
    globalNavHeading: '現場管理',
    icon: 'users',
    accent: 'management',
    items: [
      {
        id: 'portal',
        text: '現場ポータル',
        href: '/portal',
        icon: 'users',
        version: 'v1.0.0',
        activePrefixes: ['/login', '/select-site', '/no-site', '/portal'],
        desc: '現場情報の共有と試験進捗の管理。',
      },
      {
        id: 'portal-admin',
        text: '現場ポータル管理（管理者のみ）',
        href: '/portal/admin',
        icon: 'terminal',
        version: 'v1.0.0',
        desc: '基本情報・Excel連携・除外回路の管理。',
      },
      {
        id: 'master',
        text: 'マスター管理（masterのみ）',
        href: '/master',
        icon: 'sliders',
        version: 'v1.0.0',
        desc: 'メンバー・お知らせ・システム全体設定。',
        masterOnly: true,
      },
    ],
    showInDashboard: true,
  },

  {
    id: 'tools',
    heading: '計算ツール',
    globalNavHeading: '計算ツール',
    icon: 'hash',
    accent: 'tool',
    items: [
      {
        id: 'tool-voltage',
        text: '電圧降下計算・ケーブルサイズ選定',
        href: '/tools/voltage',
        icon: 'zap',
        version: 'v1.0.0',
        desc: '許容電流と電圧降下からの自動選定。',
      },
      {
        id: 'tool-conduit',
        text: '配管サイズ自動選定',
        href: '/tools/conduit',
        icon: 'target',
        version: 'v1.0.0',
        desc: '内線規程に基づく配管サイズの自動選定。',
      },
      {
        id: 'tool-rack',
        text: 'ケーブルラック選定',
        href: '/tools/rack',
        icon: 'align-justify',
        version: 'v1.0.0',
        desc: '占積率に基づくラック幅の自動選定。',
      },
      {
        id: 'tool-weight',
        text: 'ケーブル重量概算・ドラム選定',
        href: '/tools/weight',
        icon: 'package',
        version: 'v1.0.0',
        desc: '総重量の概算と木製ドラムの自動提案。',
      },
      {
        id: 'tool-history',
        text: '計算履歴',
        href: '/tools/history',
        icon: 'clipboard',
        version: 'v1.0.0',
        desc: '各種計算結果の履歴一覧と確認・管理。',
      },
    ],
    showInDashboard: true,
  },
  {
    id: 'database',
    heading: '規格データベース',
    globalNavHeading: '規格',
    icon: 'database',
    accent: 'database',
    items: [
      {
        id: 'db-cable',
        text: 'ケーブル規格',
        href: '/database/cable-db',
        icon: 'book',
        version: '2024',
        desc: '外径・許容電流等の標準規格値の参照。',
      },
      {
        id: 'db-conduit',
        text: '配管規格',
        href: '/database/conduit-db',
        icon: 'target',
        version: '2024',
        desc: '配管寸法と付属品適合サイズの確認。',
      },
      {
        id: 'db-rack',
        text: 'ケーブルラック規格',
        href: '/database/rack-db',
        icon: 'align-justify',
        version: '2024',
        desc: 'ラック標準寸法と仕様データの参照。',
      },
      {
        id: 'db-drum',
        text: 'ケーブルドラム規格',
        href: '/database/drum-db',
        icon: 'disc',
        version: '2024',
        desc: '木製ドラムの寸法・仕様データの参照。',
      },
      {
        id: 'db-torque',
        text: '締付トルク一覧表',
        href: '/database/torque-db',
        icon: 'wrench',
        version: '2024',
        desc: '端子・ボルトの標準締付トルク参照。',
      },
      {
        id: 'db-terminal',
        text: '端子規格 (R形)',
        href: '/database/terminal-db',
        icon: 'circle-dot',
        version: '2024',
        desc: 'ニチフ銅線用裸圧着端子の寸法・仕様参照。',
      },
    ],
    showInDashboard: true,
  },
  {
    id: 'reference',
    heading: '学習・リファレンス',
    globalNavHeading: '学習・リファレンス',
    icon: 'book',
    accent: 'reference',
    items: [
      {
        id: 'ref-glossary',
        text: '用語解説',
        href: '/reference/glossary',
        icon: 'book-open',
        version: 'v1.0.0',
        desc: '電気・建築設備の用語クイック辞書。',
      },
    ],
    showInDashboard: true,
  },
]

/**
 * ダッシュボード・メニューに登録されている全アイテムをフラットに取得
 */
export function getAllMenuItems(): MenuItem[] {
  return menuData.flatMap(section => section.items)
}

/**
 * ツールID（id）から MenuItem を解決するマップを取得
 */
export function getMenuItemMap(): Map<string, MenuItem> {
  const map = new Map<string, MenuItem>()

  for (const item of getAllMenuItems()) {
    if (item.id) {
      map.set(item.id, item)
    }
  }

  return map
}
