/**
 * no-card-or-box-naming
 * [ESLint Custom Rule]
 * コンポーネントファイル名およびコメントにおいて、サーフェス部品としての
 * 「Card（カード）」「Box（ボックス）」の混入を検知・禁止し、「Panel（パネル）」への統一を強制するルール。
 * ※ 正規のフォーム部品（Checkbox.vue、チェックボックス、セレクトボックス）、
 *    CSSボックスモデル、電気工事用語（プルボックス）、SVG viewBox等は対象外とします。
 */

import path from 'node:path'

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow Card and Box naming for surface components in favor of Panel',
    },
    messages: {
      noCardOrBoxFile: 'コンポーネント名「{{ name }}」に Card または Box が含まれています。サーフェス部品は「Panel」に統一してください。',
      noCardComment: 'コメント内でサーフェス部品に対する「カード」という呼称が検出されました。「パネル」に統一してください。',
      noBoxComment: 'コメント内でサーフェス部品に対する「ボックス」という呼称が検出されました。「パネル」に統一してください。',
    },
    schema: [],
  },
  create(context) {
    const rawFilename = context.filename || context.physicalFilename || ''
    const normalized = rawFilename.replace(/\\/g, '/')

    // Exclude tests, e2e, scripts, eslint-rules, and node_modules
    if (
      normalized.includes('/tests/')
      || normalized.includes('/e2e/')
      || normalized.includes('/scripts/')
      || normalized.includes('/eslint-rules/')
      || normalized.includes('/node_modules/')
    ) {
      return {}
    }

    const baseName = path.basename(normalized)

    return {
      'Program'(node) {
        // 1. ファイル名検証（Vue コンポーネント）
        if (normalized.includes('/app/components/') && baseName.endsWith('.vue')) {
          const compName = baseName.replace(/\.vue$/, '')

          // 許可リスト（正規フォーム部品等）
          const ALLOWED_COMPONENTS = ['Checkbox']

          if (!ALLOWED_COMPONENTS.includes(compName)) {
            if (/Card/i.test(compName) || /Box/i.test(compName)) {
              context.report({
                node,
                messageId: 'noCardOrBoxFile',
                data: { name: baseName },
              })
            }
          }
        }

        // 2. コメント・JSDoc 検証
        const sourceCode = context.sourceCode

        if (!sourceCode) return

        const comments = sourceCode.getAllComments()

        for (const comment of comments) {
          const text = comment.value

          // 「カード」の検出
          if (text.includes('カード')) {
            context.report({
              node: comment,
              messageId: 'noCardComment',
            })
          }

          // 「ボックス」の検出（チェックボックス、セレクトボックス、ボックスモデル、プルボックスは除外）
          if (text.includes('ボックス')) {
            const sanitized = text
              .replace(/チェックボックス/g, '')
              .replace(/セレクトボックス/g, '')
              .replace(/ボックスモデル/g, '')
              .replace(/プルボックス/g, '')

            if (sanitized.includes('ボックス')) {
              context.report({
                node: comment,
                messageId: 'noBoxComment',
              })
            }
          }
        }
      },
    }
  },
}
