/**
 * テーブル内の指定行へのスムーズスクロールおよび一時的ハイライト表示を行う純粋DOM関数
 */
export function scrollToTableRow(rowId: string | number, highlightDuration = 2000): void {
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
