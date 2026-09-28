/**
 * 回路記号（Kairo Symbol）解決ユーティリティ
 *
 * 回路記号文字列から対応する形状定義（SVG描画パラメータ等）を解決する純粋関数を提供します。
 */

import { KAIRO_SYMBOL_MAP, type KairoSymbolDefinition } from '~/constants/kairoConfig'

/**
 * 回路記号文字列から対応する形状定義を解決する純粋関数
 *
 * @param kigou 回路記号文字列（例: '丸', '二重丸', '四角' 等）
 * @returns 形状定義オブジェクト、未定義または空文字時は null
 */
export function resolveKairoSymbol(kigou?: string | null): KairoSymbolDefinition | null {
  if (!kigou) return null

  return KAIRO_SYMBOL_MAP[kigou.trim()] ?? null
}
