import { config } from '@vue/test-utils'
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
    // ignore
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

// グローバルスコープへの登録
vi.stubGlobal('useState', mockUseState)
vi.stubGlobal('useCookie', mockUseCookie)
vi.stubGlobal('useRouter', () => mockRouter)
vi.stubGlobal('useRoute', () => mockRouter.currentRoute.value)
vi.stubGlobal('navigateTo', vi.fn())

// #app からの静的 import 対策
vi.mock('#app', () => ({
  useState: mockUseState,
  useCookie: mockUseCookie,
  useRouter: () => mockRouter,
  useRoute: () => mockRouter.currentRoute.value,
  navigateTo: vi.fn(),
  useNuxtApp: () => ({
    $api: vi.fn(),
  }),
}))

// 3. Vue Test Utils の共通スタブ登録
config.global.stubs = {
  ...config.global.stubs,
  NuxtLink: {
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
  },
}
