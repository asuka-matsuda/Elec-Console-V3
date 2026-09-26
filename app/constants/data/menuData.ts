/**
 * ナビゲーションメニュー構造データ
 *
 * グローバルナビゲーションおよびダッシュボードで使用される
 * カテゴリ別メニュー（現場管理、電卓ツール、データベース、規約解説等）の定義です。
 */

import type { IconName } from '~/constants/icons'

export type MenuItem = {
  text: string
  href: string
  icon: IconName
  activePrefixes?: string[]
  desc?: string
  disabled?: boolean
  masterOnly?: boolean
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
    items: [{ text: 'ホーム', href: '/', icon: 'home' }],
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
        text: '現場ポータル',
        href: '/portal',
        icon: 'users',
        activePrefixes: ['/login', '/select-site', '/no-site', '/portal'],
        desc: '現場情報の共有と試験進捗の管理。',
      },
      {
        text: '現場ポータル管理（管理者のみ）',
        href: '/portal/admin',
        icon: 'terminal',
        desc: '基本情報・Excel連携・除外回路の管理。',
      },
      {
        text: 'マスター管理（masterのみ）',
        href: '/master',
        icon: 'sliders',
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
        text: '電圧降下計算・ケーブルサイズ選定',
        href: '/tools/voltage',
        icon: 'zap',
        desc: '許容電流と電圧降下からの自動選定。',
      },
      {
        text: '配管サイズ自動選定',
        href: '/tools/conduit',
        icon: 'target',
        desc: '内線規程に基づく配管サイズの自動選定。',
      },
      {
        text: 'ケーブルラック選定',
        href: '/tools/rack',
        icon: 'align-justify',
        desc: '占積率に基づくラック幅の自動選定。',
      },
      {
        text: 'ケーブル重量概算・ドラム選定',
        href: '/tools/weight',
        icon: 'package',
        desc: '総重量の概算と木製ドラムの自動提案。',
      },
      {
        text: '計算履歴',
        href: '/tools/history',
        icon: 'clipboard',
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
        text: 'ケーブル規格',
        href: '/database/cable-db',
        icon: 'book',
        desc: '外径・許容電流等の標準規格値の参照。',
      },
      {
        text: '配管規格',
        href: '/database/conduit-db',
        icon: 'target',
        desc: '配管寸法と付属品適合サイズの確認。',
      },
      {
        text: 'ケーブルラック規格',
        href: '/database/rack-db',
        icon: 'align-justify',
        desc: 'ラック標準寸法と仕様データの参照。',
      },
      {
        text: 'ケーブルドラム規格',
        href: '/database/drum-db',
        icon: 'disc',
        desc: '木製ドラムの寸法・仕様データの参照。',
      },
      {
        text: '締付トルク一覧表',
        href: '/database/torque-db',
        icon: 'wrench',
        desc: '端子・ボルトの標準締付トルク参照。',
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
        text: '用語解説',
        href: '/reference/glossary',
        icon: 'book-open',
        desc: '電気・建築設備の用語クイック辞書。',
      },
    ],
    showInDashboard: true,
  },
]
