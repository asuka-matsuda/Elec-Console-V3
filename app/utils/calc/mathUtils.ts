/**
 * MathJax / KaTeX 用の数式生成に関する共通ユーティリティ
 */

/**
 * ユーザーの入力や選択によって変動する値をオレンジ色でハイライトする
 * AppMathBasis.vue の :deep(.katex) .tex-color-accent に依存
 */
export function hl(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === '' || Number.isNaN(value)) {
    return '\\htmlClass{tex-color-accent}{\\text{---}}';
  }
  return `\\htmlClass{tex-color-accent}{${value}}`;
}

/**
 * 判定結果などを要件を満たす場合（Success）の色でハイライトする
 * AppMathBasis.vue の .tex-status-success に依存
 */
export function hlOk(value: string | number): string {
  return `\\htmlClass{tex-status-success}{${value}}`;
}

/**
 * 判定結果などを要件を満たさない場合（Danger）の色でハイライトする
 * AppMathBasis.vue の .tex-status-danger に依存
 */
export function hlNg(value: string | number): string {
  return `\\htmlClass{tex-status-danger}{${value}}`;
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
    tex += ` \\\\ &= ${substitution}`;
  }
  
  if (resultStr !== undefined) {
    tex += ` \\\\ &= ${resultStr}`;
    if (unit) {
      tex += ` \\text{ [${unit}]}`;
    }
  }
  
  tex += ` \\end{aligned}`;
  return tex;
}
