import katex from 'katex'

/**
 * @fileoverview 数式生成用の汎用ユーティリティ
 * 計算根拠などをTeXで表示する際に使用する、フォーマットやハイライト機能を提供します。
 */

// アプリケーション全体で統一されたハイライト用クラス
export const TEX_HL_CLASS = 'tex-color-accent'
export const TEX_SUCCESS_CLASS = 'tex-status-success'
export const TEX_DANGER_CLASS = 'tex-status-danger'

/**
 * ユーザーの入力や選択によって変動する値をオレンジ色でハイライトする
 */
export function hl(value: string | number | undefined | null): string {
  if (
    value === undefined
    || value === null
    || value === ''
    || Number.isNaN(value)
  ) {
    return `\\htmlClass{${TEX_HL_CLASS}}{\\text{---}}`
  }

  return `\\htmlClass{${TEX_HL_CLASS}}{${value}}`
}

/**
 * 数値をフォーマットし、指定されたCSSクラスでKaTeX用のhtmlClassコマンドでラップします。
 * 値が無効な場合（null/undefined/NaN）は、フォールバックの文字列（通常は変数名）をそのまま返します。
 */
export function hlVal(
  val: number | string | null | undefined,
  fallback: string,
  dec = 1,
  className = TEX_HL_CLASS,
): string {
  if (val === null || val === undefined || val === '') return fallback
  const num = parseFloat(String(val))

  if (isNaN(num)) return fallback
  const numStr = num % 1 === 0 ? num.toString() : num.toFixed(dec)

  return `\\htmlClass{${className}}{${numStr}}`
}

/**
 * 数値を指定桁数でフォーマットします。ハイライトは行いません。
 */
export function formatVal(
  val: number | string | null | undefined,
  fallback: string,
  dec = 1,
): string {
  if (val === null || val === undefined || val === '') return fallback
  const num = parseFloat(String(val))

  if (isNaN(num)) return fallback

  return num % 1 === 0 ? num.toString() : num.toFixed(dec)
}

export function hlOk(value: string | number): string {
  return `\\htmlClass{${TEX_SUCCESS_CLASS}}{${value}}`
}

export function hlNg(value: string | number): string {
  return `\\htmlClass{${TEX_DANGER_CLASS}}{${value}}`
}

/**
 * 数式の基本的なフォーマット（文字式 = 代入式 = 結果）を組み立てる
 */
export function buildFormula(
  symbols: string,
  substitution: string,
  resultStr?: string,
  unit?: string,
): string {
  let tex = `\\begin{aligned} ${symbols}`

  if (substitution) {
    const trimmed = substitution.trim()

    if (trimmed.startsWith('&=')) {
      tex += ` ${trimmed}`
    }
    else if (trimmed.startsWith('=')) {
      tex += ` &${trimmed}`
    }
    else {
      tex += ` &= ${trimmed}`
    }
  }

  if (resultStr !== undefined) {
    tex += ` \\\\ &= ${resultStr}`
    if (unit) {
      const safeUnit = unit.includes('^')
        ? unit.replace(/\^(\d+)/g, '}^$1\\text{')
        : unit

      tex += ` \\text{ [${safeUnit}]}`
    }
  }

  tex += ` \\end{aligned}`

  return tex
}

/**
 * KaTeX を用いて TeX 文字列を HTML 文字列へ変換する
 */
export function renderMath(mathStr: string, isDisplay = true): string {
  if (!mathStr) return ''
  try {
    return katex.renderToString(mathStr, {
      displayMode: isDisplay,
      throwOnError: false,
      trust: true,
      strict: false,
    })
  }
  catch (e) {
    console.error('KaTeX render error:', e)

    return mathStr
  }
}

/**
 * 凡例文字列配列（"記号: 説明"）をパースし、描画済みシンボルと説明に分解する
 */
export function parseLegend(
  legendArray: string[] | undefined,
): Array<{ name: string, renderedSymbol: string }> {
  if (!legendArray) return []

  return legendArray.map((leg) => {
    const parts = leg.split(':')
    let rawSymbol = parts[0]?.trim() || ''

    rawSymbol = rawSymbol.replace(/\\\(/g, '').replace(/\\\)/g, '').trim()
    const name = parts.slice(1).join(':')?.trim() || leg

    return {
      name,
      renderedSymbol: renderMath(rawSymbol, false),
    }
  })
}
