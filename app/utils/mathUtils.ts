/**
 * @fileoverview 数式生成用の汎用ユーティリティ
 * 計算根拠などをTeXで表示する際に使用する、フォーマットやハイライト機能を提供します。
 */

// アプリケーション全体で統一されたハイライト色（Warning相当）
export const TEX_HL_COLOR = '#f5a623';

/**
 * 数値をフォーマットし、指定された色でKaTeX用のtextcolorコマンドでラップします。
 * 値が無効な場合（null/undefined/NaN）は、フォールバックの文字列（通常は変数名）をそのまま返します。
 * ユーザー入力値など、数式内で目立たせたい値に使用します。
 *
 * @param val - フォーマット対象の数値
 * @param fallback - 数値が無効な場合の代替文字列
 * @param dec - 小数点以下の桁数（デフォルト: 1）
 * @param color - ハイライト色
 */
export function hlVal(val: number | string | null | undefined, fallback: string, dec = 1, color = TEX_HL_COLOR): string {
    if (val === null || val === undefined || val === '' || isNaN(Number(val))) return fallback;
    const num = Number(val);
    const numStr = num % 1 === 0 ? num.toString() : num.toFixed(dec);
    return `\\textcolor{${color}}{${numStr}}`;
}

/**
 * 数値を指定桁数でフォーマットします。ハイライトは行いません。
 * 定数やシステムから自動取得された値などに使用します。
 *
 * @param val - フォーマット対象の数値
 * @param fallback - 数値が無効な場合の代替文字列
 * @param dec - 小数点以下の桁数（デフォルト: 1）
 */
export function formatVal(val: number | string | null | undefined, fallback: string, dec = 1): string {
    if (val === null || val === undefined || val === '' || isNaN(Number(val))) return fallback;
    const num = Number(val);
    return num % 1 === 0 ? num.toString() : num.toFixed(dec);
}
