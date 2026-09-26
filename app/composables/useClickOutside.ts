/**
 * 外側クリック検知 Composable
 *
 * @description 指定したDOM要素の外側がクリックされたことを検知し、コールバック関数を実行します（ドロップダウン・モーダル制御用）。
 * @param targetRef 監視対象要素のRef
 * @param callback 外側クリック時に実行するコールバック
 */

import { onMounted, onUnmounted, type Ref } from 'vue'

export function useClickOutside(
  elementRef: Ref<HTMLElement | null>,
  callback: (event: MouseEvent) => void,
  options?: { ignore?: Ref<HTMLElement | null>[] },
) {
  const handleClickOutside = (event: MouseEvent) => {
    // 自身の中のクリックなら無視
    if (elementRef.value && elementRef.value.contains(event.target as Node)) {
      return
    }

    // 除外指定（ignore）された要素の中のクリックなら無視
    if (options?.ignore) {
      for (const ignoreRef of options.ignore) {
        if (ignoreRef.value && ignoreRef.value.contains(event.target as Node)) {
          return
        }
      }
    }

    // どちらでもなければ外側クリックとしてコールバックを実行
    callback(event)
  }

  onMounted(() => {
    // mousedownにすることで、ドラッグなどで外に外れた時の誤発火を防ぐこともできるが今回はclickで維持
    document.addEventListener('click', handleClickOutside, { capture: true })
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside, {
      capture: true,
    })
  })
}
