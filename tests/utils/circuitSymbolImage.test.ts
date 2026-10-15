import { beforeEach, describe, expect, it, vi } from 'vitest'

import { generateCircuitSymbolPng } from '../../app/utils/circuitSymbolImage'

describe('circuitSymbolImage', () => {
  const mockCtx = {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    strokeRect: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    lineWidth: 0,
    strokeStyle: '',
    lineJoin: '',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    if (typeof HTMLCanvasElement !== 'undefined') {
      HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCtx)
      HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      )
    }
  })

  it('generateCircuitSymbolPng: 引数なし・null・未定義記号に対して null を返し、描画を行わないこと', () => {
    expect(generateCircuitSymbolPng(null)).toBeNull()
    expect(generateCircuitSymbolPng(undefined)).toBeNull()
    expect(generateCircuitSymbolPng('')).toBeNull()
    expect(generateCircuitSymbolPng('存在しない記号')).toBeNull()
    expect(mockCtx.stroke).not.toHaveBeenCalled()
  })

  it('generateCircuitSymbolPng: 各記号ごとに適切な Canvas 2D プリミティブ（arc/ellipse/strokeRect/moveTo-lineTo）が呼ばれること', () => {
    // 1. 丸 (arc 1回)
    vi.clearAllMocks()
    const pngCircle = generateCircuitSymbolPng('丸', { width: 41, height: 24 })

    expect(pngCircle).toMatch(/^data:image\/png;base64,/)
    expect(mockCtx.arc).toHaveBeenCalledTimes(1)
    expect(mockCtx.stroke).toHaveBeenCalledTimes(1)

    // 2. 二重丸 (外円 + 内円で arc 2回)
    vi.clearAllMocks()
    const pngDoubleCircle = generateCircuitSymbolPng('二重丸', { width: 41, height: 24 })

    expect(pngDoubleCircle).toMatch(/^data:image\/png;base64,/)
    expect(mockCtx.arc).toHaveBeenCalledTimes(2)
    expect(mockCtx.stroke).toHaveBeenCalledTimes(2)

    // 3. 楕円 (ellipse 1回)
    vi.clearAllMocks()
    const pngEllipse = generateCircuitSymbolPng('楕円', { width: 41, height: 24 })

    expect(pngEllipse).toMatch(/^data:image\/png;base64,/)
    expect(mockCtx.ellipse).toHaveBeenCalledTimes(1)
    expect(mockCtx.stroke).toHaveBeenCalledTimes(1)

    // 4. 四角 (strokeRect 1回)
    vi.clearAllMocks()
    const pngRect = generateCircuitSymbolPng('四角', { width: 41, height: 24 })

    expect(pngRect).toMatch(/^data:image\/png;base64,/)
    expect(mockCtx.strokeRect).toHaveBeenCalledTimes(1)

    // 5. 三角 (moveTo 1回 + lineTo 2回 + closePath 1回)
    vi.clearAllMocks()
    const pngTriangle = generateCircuitSymbolPng('三角', { width: 41, height: 24 })

    expect(pngTriangle).toMatch(/^data:image\/png;base64,/)
    expect(mockCtx.moveTo).toHaveBeenCalledTimes(1)
    expect(mockCtx.lineTo).toHaveBeenCalledTimes(2)
    expect(mockCtx.closePath).toHaveBeenCalledTimes(1)
    expect(mockCtx.stroke).toHaveBeenCalledTimes(1)
  })
})
