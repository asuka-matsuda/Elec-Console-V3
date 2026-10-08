/**
 * 型安全な useState ラッパー Composable
 *
 * @description STATE_KEYS のキー名を渡すだけで、AppStateMap に定義された
 * 対応する型の Ref を自動推論して返却します。
 */

import type { Ref } from 'vue'

import { useState } from '#app'
import type { AppStateMap } from '~/types/state'

export function useAppState<K extends keyof AppStateMap>(
  key: K,
  init?: () => AppStateMap[K],
): Ref<AppStateMap[K]> {
  return useState(key, init) as Ref<AppStateMap[K]>
}
