/**
 * no-hover-transition-override
 * [ESLint Custom Rule]
 * :hover または :active 擬似クラスを含む CSS ルールブロック内での
 * transition プロパティの上書き宣言を禁止するルール。
 * （マウス進入時・離脱時の対称性を担保し、背景色や文字色のアニメーション消失・カクつきを防止）
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow transition property override inside hover/active pseudo-states',
    },
    messages: {
      forbidden: 'ホバー・アクティブ時（{{ selector }}）に transition を上書きすることは禁止されています。背景色や文字色のアニメーション消失・非対称なカクつきの原因となるため、ベースセレクタ（通常時）で --transition-interactive または --transition-panel を指定してください。',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename()

    if (!filename.endsWith('.vue')) return {}

    return {
      Program() {
        const sourceCode = context.sourceCode || context.getSourceCode()
        const text = sourceCode.getText()

        const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/g
        let styleMatch

        while ((styleMatch = styleRegex.exec(text)) !== null) {
          const styleContent = styleMatch[1]
          const styleStartIndex = styleMatch.index + styleMatch[0].indexOf(styleContent)

          // ルールブロックの抽出
          const ruleRegex = /([^{}]+)\{([^{}]+)\}/g
          let ruleMatch

          while ((ruleMatch = ruleRegex.exec(styleContent)) !== null) {
            const selector = ruleMatch[1].trim()
            const body = ruleMatch[2]

            // :hover または :active を含むセレクタを対象
            if (/:(hover|active)\b/.test(selector)) {
              const transMatch = /transition\s*:\s*([^;]+);/.exec(body)

              if (transMatch) {
                const transOffset = styleStartIndex + ruleMatch.index + ruleMatch[0].indexOf(transMatch[0])
                const loc = sourceCode.getLocFromIndex(transOffset)

                context.report({
                  loc: {
                    start: loc,
                    end: { line: loc.line, column: loc.column + transMatch[0].length },
                  },
                  messageId: 'forbidden',
                  data: {
                    selector: selector.replace(/\s+/g, ' '),
                  },
                })
              }
            }
          }
        }
      },
    }
  },
}
