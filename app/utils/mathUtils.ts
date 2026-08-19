/**
 * @fileoverview 数式生成用の汎用ユーティリティ
 * 計算根拠などをTeXで表示する際に使用する、フォーマットやハイライト機能を提供します。
 */

// アプリケーション全体で統一されたハイライト用クラス（Accent相当）
export const TEX_HL_CLASS = 'tex-color-accent';
export const TEX_SUCCESS_CLASS = 'tex-status-success';
export const TEX_DANGER_CLASS = 'tex-status-danger';

/**
 * 数値をフォーマットし、指定されたCSSクラスでKaTeX用のhtmlClassコマンドでラップします。
 * 値が無効な場合（null/undefined/NaN）は、フォールバックの文字列（通常は変数名）をそのまま返します。
 * ユーザー入力値など、数式内で目立たせたい値に使用します。
 *
 * @param val - フォーマット対象の数値
 * @param fallback - 数値が無効な場合の代替文字列
 * @param dec - 小数点以下の桁数（デフォルト: 1）
 * @param className - 付与するCSSクラス名
 */
export function hlVal(val: number | string | null | undefined, fallback: string, dec = 1, className = TEX_HL_CLASS): string {
    if (val === null || val === undefined || val === '') return fallback;
    const num = parseFloat(String(val));
    if (isNaN(num)) return fallback;
    const numStr = num % 1 === 0 ? num.toString() : num.toFixed(dec);
    return `\\htmlClass{${className}}{${numStr}}`;
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
    if (val === null || val === undefined || val === '') return fallback;
    const num = parseFloat(String(val));
    if (isNaN(num)) return fallback;
    return num % 1 === 0 ? num.toString() : num.toFixed(dec);
}

/**
 * 判定結果などを要件を満たす場合（Success）の色でハイライトする
 */
export function hlOk(value: string | number): string {
    return `\\htmlClass{${TEX_SUCCESS_CLASS}}{${value}}`;
}

/**
 * 判定結果などを要件を満たさない場合（Danger）の色でハイライトする
 */
export function hlNg(value: string | number): string {
    return `\\htmlClass{${TEX_DANGER_CLASS}}{${value}}`;
}

/**
 * 数式の基本的なフォーマット（文字式 = 代入式 = 結果）を組み立てる
 */
export function buildFormula(
    symbols: string,
    substitution: string,
    resultStr?: string,
    unit?: string
): string {
    let tex = `\\begin{aligned} ${symbols}`;
    
    if (substitution) {
        tex += ` &= ${substitution}`;
    }
    
    if (resultStr !== undefined) {
        tex += ` \\\\ &= ${resultStr}`;
        if (unit) {
            // 単位の中に ^（上付き）が含まれる場合、\text{}内ではエラーになるため安全な形式に変換する
            const safeUnit = unit.includes('^') ? unit.replace(/\^(\d+)/g, '}^$1\\text{') : unit;
            tex += ` \\text{ [${safeUnit}]}`;
        }
    }
    
    tex += ` \\end{aligned}`;
    return tex;
}
