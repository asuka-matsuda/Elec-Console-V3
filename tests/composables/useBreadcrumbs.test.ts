import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useBreadcrumbs } from '../../app/composables/useBreadcrumbs'

const mockRoute = ref({ path: '/' })
const mockSites = ref([{ id: 'site-1', name: '東京現場' }])
const mockFetchSites = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute.value,
}))

vi.mock('~/composables/admin/useAdminSites', () => ({
  useAdminSites: () => ({
    sites: mockSites,
    fetchSites: mockFetchSites,
  }),
}))

describe('useBreadcrumbs', () => {
  it('ホーム画面（/）ではパンくずが空配列で accent は main になる', () => {
    mockRoute.value = { path: '/' }
    const { items, accent } = useBreadcrumbs()

    expect(items.value).toEqual([])
    expect(accent.value).toBe('main')
  })

  it('現場トップ（/portal/:siteId）で現場管理と現場名が構築される', () => {
    mockRoute.value = { path: '/portal/site-1' }
    const { items, accent } = useBreadcrumbs()

    expect(items.value).toEqual([
      { text: '現場管理' },
      { text: '東京現場' },
    ])
    expect(accent.value).toBe('management')
  })

  it('送電試験画面（/portal/:siteId/souden）で正しいパンくずが構築される', () => {
    mockRoute.value = { path: '/portal/site-1/souden' }
    const { items, accent } = useBreadcrumbs()

    expect(items.value).toEqual([
      { text: '現場管理' },
      { text: '東京現場' },
      { text: '送電試験' },
    ])
    expect(accent.value).toBe('management')
  })

  it('操作ログ画面（/portal/:siteId/operation-logs）で4階層のパンくずが構築される', () => {
    mockRoute.value = { path: '/portal/site-1/operation-logs' }
    const { items, accent } = useBreadcrumbs()

    expect(items.value).toEqual([
      { text: '現場管理' },
      { text: '東京現場' },
      { text: '送電試験' },
      { text: '操作ログ' },
    ])
    expect(accent.value).toBe('management')
  })

  it('未登録の現場IDの場合はIDがそのままフォールバック表示される', () => {
    mockRoute.value = { path: '/portal/unknown-site-99' }
    const { items, accent } = useBreadcrumbs()

    expect(items.value).toEqual([
      { text: '現場管理' },
      { text: 'unknown-site-99' },
    ])
    expect(accent.value).toBe('management')
  })

  it('静的メニューの完全一致で正しい見出しとアイテム名が構築される', () => {
    mockRoute.value = { path: '/portal' }
    const { items, accent } = useBreadcrumbs()

    expect(items.value).toEqual([
      { text: '現場管理' },
      { text: '現場ポータル' },
    ])
    expect(accent.value).toBe('management')
  })

  it('activePrefixesによる前方一致で正しい見出しとアイテム名が構築される', () => {
    mockRoute.value = { path: '/login' }
    const { items, accent } = useBreadcrumbs()

    expect(items.value).toEqual([
      { text: '現場管理' },
      { text: '現場ポータル' },
    ])
    expect(accent.value).toBe('management')
  })

  it('未知の動的パスではセグメントの先頭大文字化フォールバックが機能する', () => {
    mockRoute.value = { path: '/unknown/dynamic-page' }
    const { items, accent } = useBreadcrumbs()

    expect(items.value).toEqual([
      { text: 'Unknown' },
      { text: 'Dynamic-page' },
    ])
    expect(accent.value).toBe('main')
  })
})
