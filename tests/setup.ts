/**
 * Vitest テスト環境共通セットアップ
 *
 * Happy-DOM 環境における KaTeX 警告の抑制、Nuxt コア Composable のモック、
 * および Vue Test Utils の共通スタブ登録を行います。
 */

import { config } from '@vue/test-utils'
import { getContext } from 'unctx'
import { vi } from 'vitest'
import { ref } from 'vue'

// 1. Happy-DOM 環境で KaTeX の quirks mode 警告（compatMode !== 'CSS1Compat'）およびフォント警告を防止
if (typeof document !== 'undefined') {
  try {
    Object.defineProperty(document, 'compatMode', {
      value: 'CSS1Compat',
      configurable: true,
    })
  }
  catch {
    // Happy-DOM のプロパティ定義不可環境でのエラーを無視
  }
}

// KaTeX のメトリクス警告（No character metrics for ...）をテスト実行時に抑制
const originalWarn = console.warn

console.warn = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && (args[0].includes('No character metrics') || args[0].includes('quirks mode'))) {
    return
  }
  originalWarn(...args)
}

// 2. Nuxt コア Composable のグローバルモック
const stateMap = new Map<string, unknown>()
const cookieMap = new Map<string, unknown>()

const mockUseState = (key: string, init?: () => unknown) => {
  if (!stateMap.has(key)) {
    stateMap.set(key, ref(init ? init() : undefined))
  }

  return stateMap.get(key)
}

const mockUseCookie = (key: string, opts?: { default?: () => unknown }) => {
  if (!cookieMap.has(key)) {
    const defaultVal = opts?.default ? opts.default() : null

    cookieMap.set(key, ref(defaultVal))
  }

  return cookieMap.get(key)
}

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  currentRoute: ref({ path: '/', query: {}, params: {} }),
}

const mockNuxtApp = {
  _id: 'nuxt-app',
  payload: { state: {} },
  _state: {},
  $api: vi.fn(),
  runWithContext: <T>(fn: () => T): T => fn(),
}

try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getContext('nuxt-app').set(mockNuxtApp as any, true)
}
catch {
  // unctx コンテキスト設定エラーを無視（単体実行環境用フォールバック）
}

// グローバルスコープへの登録
vi.stubGlobal('useState', mockUseState)
vi.stubGlobal('useCookie', mockUseCookie)
vi.stubGlobal('useRouter', () => mockRouter)
vi.stubGlobal('useRoute', () => mockRouter.currentRoute.value)
vi.stubGlobal('navigateTo', vi.fn())
vi.stubGlobal('useNuxtApp', () => mockNuxtApp)

// #app / #imports からの静的 import 対策
vi.mock('#app', () => ({
  useState: mockUseState,
  useCookie: mockUseCookie,
  useRouter: () => mockRouter,
  useRoute: () => mockRouter.currentRoute.value,
  navigateTo: vi.fn(),
  useNuxtApp: () => mockNuxtApp,
}))

// 3. Vue Test Utils の共通スタブ登録
config.global.stubs = {
  ...config.global.stubs,
  NuxtLink: {
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
  },
}
