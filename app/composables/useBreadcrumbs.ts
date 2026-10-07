/**
 * パンくずリスト自動生成 Composable
 *
 * @description 現在のルートパスおよび現場名・メニュー構造から階層化されたパンくずリストデータを動的に生成します。
 * 親階層へのナビゲーションリンク（to）を自動解決し、ベストプラクティスに準拠した階層構造を提供します。
 */

import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { useAdminSites } from '~/composables/admin/useAdminSites'
import { menuData, type MenuItem, type MenuSection } from '~/constants/data/menuData'
import type { BreadcrumbItem } from '~/types/components'

type BreadcrumbAccent = NonNullable<MenuSection['accent']>

interface BreadcrumbsData {
  items: BreadcrumbItem[]
  accent: BreadcrumbAccent
}

interface SubFeatureConfig {
  title: string
  parent?: {
    title: string
    subPath: string
  }
}

/** 現場ポータル配下の機能定義マップ */
const PORTAL_SUB_FEATURES: Record<string, SubFeatureConfig> = {
  'souden': { title: '送電試験' },
  'phase1': {
    title: 'フェーズ1：回路確認・増締',
    parent: { title: '送電試験', subPath: 'souden' },
  },
  'phase2': {
    title: 'フェーズ2：絶縁抵抗測定',
    parent: { title: '送電試験', subPath: 'souden' },
  },
  'phase3': {
    title: 'フェーズ3：送電・電圧測定・検相',
    parent: { title: '送電試験', subPath: 'souden' },
  },
  'operation-logs': {
    title: '操作ログ',
    parent: { title: '送電試験', subPath: 'souden' },
  },
  'reports': { title: '帳票出力' },
  'tag-print': { title: 'タグ出力' },
  'remote-control': { title: 'リモコン設定' },
  'template-keys': { title: 'テンプレートキー一覧' },
  'template-tags': { title: 'テンプレートキー一覧' },
}

function createMenuBreadcrumbs(section: MenuSection, item: MenuItem): BreadcrumbsData {
  const crumbs: BreadcrumbItem[] = []

  if (section.heading) {
    crumbs.push({ text: section.heading })
  }
  crumbs.push({ text: item.text })

  return { items: crumbs, accent: section.accent || 'main' }
}

export function useBreadcrumbs() {
  const route = useRoute()
  const { sites, fetchSites, isLoaded } = useAdminSites()

  if (import.meta.client && !isLoaded?.value) {
    fetchSites()
  }

  const data = computed<BreadcrumbsData>(() => {
    // ホーム画面ではパンくずを表示しない
    if (route.path === '/') {
      return { items: [], accent: 'main' }
    }

    // マイページ
    if (route.path === '/mypage') {
      return { items: [{ text: 'マイページ' }], accent: 'main' }
    }

    // 1. 現場ポータル配下の動的ルーティング (/portal/:siteId/...) の判定
    const portalMatch = route.path.match(/^\/portal\/([^/]+)(?:\/(.*))?$/)

    if (portalMatch) {
      const siteId = portalMatch[1]
      const subPath = (portalMatch[2] || '').replace(/\/$/, '')

      if (siteId && siteId !== 'admin') {
        const site = sites.value.find(s => s.id === siteId)
        const siteName = site?.name || siteId

        // 現場トップ (/portal/:siteId)
        if (!subPath) {
          return {
            items: [
              { text: '現場管理', to: '/portal/admin' },
              { text: siteName },
            ],
            accent: 'management',
          }
        }

        // 現場配下の下層ページ (/portal/:siteId/...)
        const crumbs: BreadcrumbItem[] = [
          { text: '現場管理', to: '/portal/admin' },
          { text: siteName, to: `/portal/${siteId}` },
        ]

        const feature = PORTAL_SUB_FEATURES[subPath]

        if (feature) {
          if (feature.parent) {
            crumbs.push({
              text: feature.parent.title,
              to: `/portal/${siteId}/${feature.parent.subPath}`,
            })
          }
          crumbs.push({ text: feature.title })
        }
        else {
          crumbs.push({ text: subPath })
        }

        return { items: crumbs, accent: 'management' }
      }
    }

    // 2. 静的メニュー（menuData）との完全一致 (Pass 1: Exact match)
    for (const section of menuData) {
      if (section.id === 'home') continue

      for (const item of section.items) {
        if (route.path === item.href) {
          return createMenuBreadcrumbs(section, item)
        }
      }
    }

    // 3. 静的メニュー（menuData）との前方一致 (Pass 2: Prefix match)
    for (const section of menuData) {
      if (section.id === 'home') continue

      for (const item of section.items) {
        let isMatch = false

        if (item.activePrefixes) {
          isMatch = item.activePrefixes.some(prefix =>
            route.path.startsWith(prefix),
          )
        }

        if (!isMatch && item.href !== '/') {
          if (route.path.startsWith(item.href + '/')) {
            isMatch = true
          }
        }

        if (isMatch) {
          return createMenuBreadcrumbs(section, item)
        }
      }
    }

    // 4. フォールバック (menuDataに定義されていない動的/未知のURL)
    const segments = route.path.split('/').filter(Boolean)
    const dynamicCrumbs: BreadcrumbItem[] = segments.map(seg => ({
      text: seg.charAt(0).toUpperCase() + seg.slice(1),
    }))

    return { items: dynamicCrumbs, accent: 'main' }
  })

  return {
    items: computed(() => data.value.items),
    accent: computed(() => data.value.accent),
  }
}
