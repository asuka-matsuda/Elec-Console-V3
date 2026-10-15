/**
 * 回路記号の背景透過 PNG 生成ユーティリティ（ブラウザ用）
 *
 * @description 回路記号（丸・二重丸・四角・多角形など）を HTML5 Canvas 上に
 * 背景透過の黒枠線ベクターとして描画し、Base64 PNG 画像を生成します。
 */
import { resolveKairoSymbol } from '~/utils/kairo'

/**
 * 回路記号の描画サイズ定義
 */
export interface CircuitSymbolDimensions {
  width?: number
  height?: number
}

/**
 * 記号名から背景透過 PNG の Base64 文字列（data:image/png;base64,...）を生成
 */
export function generateCircuitSymbolPng(
  kigou: string | null | undefined,
  sizeOrDimensions: number | CircuitSymbolDimensions = 32,
): string | null {
  if (!kigou || typeof document === 'undefined') return null

  const symbolDef = resolveKairoSymbol(kigou)

  if (!symbolDef) return null

  const width = typeof sizeOrDimensions === 'number'
    ? sizeOrDimensions
    : (sizeOrDimensions.width || 32)
  const height = typeof sizeOrDimensions === 'number'
    ? sizeOrDimensions
    : (sizeOrDimensions.height || width)

  const canvas = document.createElement('canvas')

  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')

  if (!ctx) return null

  // 背景を完全透明にクリア
  ctx.clearRect(0, 0, width, height)
  ctx.strokeStyle = '#1e293b' // スレート系のダークカラー（Excel上で見やすい）
  ctx.lineWidth = 1.6
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  const centerX = width / 2
  const centerY = height / 2
  const padding = 2.5
  const minDim = Math.min(width, height)
  const baseScale = minDim / 40

  if (symbolDef.type === 'circle') {
    // 外丸（中央配置・短辺基準）
    const r = (minDim / 2) - padding

    ctx.beginPath()
    ctx.arc(centerX, centerY, Math.max(r, 1), 0, Math.PI * 2)
    ctx.stroke()

    // 二重丸の内側
    if (symbolDef.isDouble) {
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.arc(centerX, centerY, Math.max(r - (4 * baseScale), 1), 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  else if (symbolDef.type === 'ellipse') {
    const rx = Math.max(centerX - padding, 1)
    const ry = Math.max(centerY - padding, 1)

    ctx.beginPath()
    ctx.ellipse(centerX, centerY, rx, ry, 0, 0, Math.PI * 2)
    ctx.stroke()

    if (symbolDef.isDouble) {
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.ellipse(centerX, centerY, Math.max(rx - (3.5 * baseScale), 1), Math.max(ry - (3.5 * baseScale), 1), 0, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  else if (symbolDef.type === 'rect') {
    const rWidth = width - (padding * 2)
    const rHeight = height - (padding * 2)

    ctx.strokeRect(padding, padding, rWidth, rHeight)

    if (symbolDef.isDouble) {
      ctx.lineWidth = 1.2
      const innerOffsetX = 3.5 * baseScale
      const innerOffsetY = 3.5 * baseScale
      const innerW = rWidth - (innerOffsetX * 2)
      const innerH = rHeight - (innerOffsetY * 2)

      if (innerW > 0 && innerH > 0) {
        ctx.strokeRect(padding + innerOffsetX, padding + innerOffsetY, innerW, innerH)
      }
    }
  }
  else if (symbolDef.type === 'polygon' && symbolDef.points) {
    // 40x40 座標系のポリゴンを中央に配置
    const offsetX = centerX - (20 * baseScale)
    const offsetY = centerY - (20 * baseScale)

    const drawPolygon = (ptsStr: string, lineWidth: number) => {
      ctx.lineWidth = lineWidth
      const pairs = ptsStr.trim().split(/\s+/)

      if (pairs.length === 0) return

      ctx.beginPath()
      pairs.forEach((pair, idx) => {
        const [xStr, yStr] = pair.split(',')

        if (xStr === undefined || yStr === undefined) return
        const x = offsetX + (parseFloat(xStr) * baseScale)
        const y = offsetY + (parseFloat(yStr) * baseScale)

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
