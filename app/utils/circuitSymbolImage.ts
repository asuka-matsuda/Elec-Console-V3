/**
 * 回路記号の背景透過 PNG 生成ユーティリティ（ブラウザ用）
 *
 * @description 回路記号（丸・二重丸・四角・多角形など）を HTML5 Canvas 上に
 * 背景透過の黒枠線ベクターとして描画し、Base64 PNG 画像を生成します。
 */
import { resolveKairoSymbol } from '~/constants/kairoConfig'

/**
 * 記号名から背景透過 PNG の Base64 文字列（data:image/png;base64,...）を生成
 */
export function generateCircuitSymbolPng(
  kigou: string | null | undefined,
  size = 32,
): string | null {
  if (!kigou || typeof document === 'undefined') return null

  const symbolDef = resolveKairoSymbol(kigou)

  if (!symbolDef) return null

  const canvas = document.createElement('canvas')

  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')

  if (!ctx) return null

  // 背景を完全透明にクリア
  ctx.clearRect(0, 0, size, size)
  ctx.strokeStyle = '#1e293b' // スレート系のダークカラー（Excel上で見やすい）
  ctx.lineWidth = 1.6
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  const center = size / 2
  const padding = 2.5
  const baseScale = size / 40

  if (symbolDef.type === 'circle') {
    // 外丸
    ctx.beginPath()
    ctx.arc(center, center, center - padding, 0, Math.PI * 2)
    ctx.stroke()

    // 二重丸の内側
    if (symbolDef.isDouble) {
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.arc(center, center, center - padding - (4 * baseScale), 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  else if (symbolDef.type === 'ellipse') {
    const rx = center - padding
    const ry = (center - padding) * 0.72

    ctx.beginPath()
    ctx.ellipse(center, center, rx, ry, 0, 0, Math.PI * 2)
    ctx.stroke()

    if (symbolDef.isDouble) {
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.ellipse(center, center, rx - (3.5 * baseScale), ry - (3.5 * baseScale), 0, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  else if (symbolDef.type === 'rect') {
    const rSize = size - (padding * 2)

    ctx.strokeRect(padding, padding, rSize, rSize)

    if (symbolDef.isDouble) {
      ctx.lineWidth = 1.2
      const innerOffset = 3.5 * baseScale
      const innerSize = size - ((padding + innerOffset) * 2)

      ctx.strokeRect(padding + innerOffset, padding + innerOffset, innerSize, innerSize)
    }
  }
  else if (symbolDef.type === 'polygon' && symbolDef.points) {
    const drawPolygon = (ptsStr: string, lineWidth: number) => {
      ctx.lineWidth = lineWidth
      const pairs = ptsStr.trim().split(/\s+/)

      if (pairs.length === 0) return

      ctx.beginPath()
      pairs.forEach((pair, idx) => {
        const [xStr, yStr] = pair.split(',')

        if (xStr === undefined || yStr === undefined) return
        const x = parseFloat(xStr) * baseScale
        const y = parseFloat(yStr) * baseScale

        if (idx === 0) {
          ctx.moveTo(x, y)
        }
        else {
          ctx.lineTo(x, y)
        }
      })
      ctx.closePath()
      ctx.stroke()
    }

    drawPolygon(symbolDef.points, 1.6)

    if (symbolDef.isDouble && symbolDef.innerPoints) {
      drawPolygon(symbolDef.innerPoints, 1.2)
    }
  }

  return canvas.toDataURL('image/png')
}
