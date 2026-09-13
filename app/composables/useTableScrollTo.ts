/**
 * useTableScrollTo.ts
 * テーブル内の指定行へのスムーズスクロールおよび一時的ハイライト表示を提供するComposable。
 */
export function useTableScrollTo() {
  const scrollToRow = (rowId: string | number, highlightDuration = 2000) => {
    if (typeof document === 'undefined') return

    const id = String(rowId).startsWith('row-') ? String(rowId) : `row-${rowId}`
    const el = document.getElementById(id)

    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('is-highlighted')
      setTimeout(() => {
        el.classList.remove('is-highlighted')
      }, highlightDuration)
    }
  }

  return {
    scrollToRow,
  }
}
