import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { useAdminSites } from '~/composables/admin/useAdminSites'
import { menuData } from '~/constants/data/menuData'
import type { BreadcrumbItem } from '~/types/components'

export function useBreadcrumbs() {
  const route = useRoute()
  const { sites, fetchSites } = useAdminSites()

  if (import.meta.client && sites.value.length === 0) {
    fetchSites()
  }

  const data = computed<{ items: BreadcrumbItem[], accent: string }>(() => {
    // ホーム画面ではパンくずを表示しない
    if (route.path === '/') {
      return { items: [], accent: 'main' }
    }

    // 1. 現場ポータル配下の動的ルーティング (/portal/:siteId/...) の判定
    const portalMatch = route.path.match(/^\/portal\/([^/]+)(?:\/(.*))?$/)

    if (portalMatch) {
      const siteId = portalMatch[1]
      const subPath = (portalMatch[2] || '').replace(/\/$/, '')

      if (siteId && siteId !== 'admin') {
        const site = sites.value.find(s => s.id === siteId)
        const siteName = site?.name || siteId

        // カテゴリ: 現場管理（非リンク）
        const categoryItem: BreadcrumbItem = { text: '現場管理' }

        // 送電試験ダッシュボード および 各フェーズ (Phase 1〜3)
        // 表示: 現場管理 » 現場名（リンク） » 送電試験（現在地・非リンク）
        if (
          subPath === 'souden'
          || subPath.startsWith('phase')
        ) {
          return {
            items: [
              categoryItem,
              { text: siteName, href: `/portal/${siteId}` },
              { text: '送電試験' },
            ],
            accent: 'management',
          }
        }

        // 操作ログ
        if (subPath === 'operation-logs') {
          return {
            items: [
              categoryItem,
              { text: siteName, href: `/portal/${siteId}` },
              { text: '送電試験', href: `/portal/${siteId}/souden` },
              { text: '操作ログ' },
            ],
            accent: 'management',
          }
        }

        // 現場トップ (/portal/:siteId)
        // 表示: 現場管理 » 現場名（現在地・非リンク）
        if (!subPath) {
          return {
            items: [
              categoryItem,
              { text: siteName },
            ],
            accent: 'management',
          }
        }

        // その他の現場下層ページ
        return {
          items: [
            categoryItem,
            { text: siteName, href: `/portal/${siteId}` },
            { text: subPath },
          ],
          accent: 'management',
        }
      }
    }

    // 2. 静的メニュー（menuData）との完全一致 (Pass 1: Exact match)
    for (const section of menuData) {
      if (section.id === 'home') continue

      for (const item of section.items) {
        if (route.path === item.href) {
          const crumbs: BreadcrumbItem[] = []

          if (section.heading) {
            crumbs.push({ text: section.heading })
          }
          crumbs.push({ text: item.text })

          return { items: crumbs, accent: section.accent || 'main' }
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
          const crumbs: BreadcrumbItem[] = []

          if (section.heading) {
            crumbs.push({ text: section.heading })
          }
          crumbs.push({ text: item.text })

          return { items: crumbs, accent: section.accent || 'main' }
        }
      }
    }

    // 4. フォールバック (menuDataに定義されていない動的/未知のURL)
    const segments = route.path.split('/').filter(Boolean)
    const dynamicCrumbs: BreadcrumbItem[] = segments.map((seg, idx) => {
      const isLast = idx === segments.length - 1

      return {
        text: seg.charAt(0).toUpperCase() + seg.slice(1),
        href: isLast ? undefined : '/' + segments.slice(0, idx + 1).join('/'),
      }
    })

    return { items: dynamicCrumbs, accent: 'main' }
  })

  return {
    items: computed(() => data.value.items),
    accent: computed(() => data.value.accent),
  }
}
