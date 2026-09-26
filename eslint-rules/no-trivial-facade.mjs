/**
 * no-trivial-facade
 * [ESLint Custom Rule]
 * 実質数行で他モジュールを単に re-export しているだけの極小ファサードファイルを禁止するルール。
 *
 * 理由: calcVoltageEngine.ts のように、他ファイルの関数を単に右から左へ流すだけの極小ファイルは、
 * 呼び出し元の認知負荷を高め、ファイル階層を無駄に深くします。
 * モジュールを直接インポートするか、共通モジュールへ統合してください。
 */

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow trivial facade files that only re-export from other files without implementation',
    },
    messages: {
      noTrivialFacade: '他ファイルを単に re-export しているだけの極小ファサードファイルは禁止されています。参照元から直接目的のモジュールをインポートするか、モジュールへ統合してください。',
    },
    schema: [],
  },
  create(context) {
    const rawFilename = context.filename || context.physicalFilename || ''
    const normalized = rawFilename.replace(/\\/g, '/')

    // Exclude tests, build outputs, index files (which are legitimate entrypoints), and types
    if (
      normalized.includes('/tests/')
      || normalized.includes('/e2e/')
      || normalized.includes('/.nuxt/')
      || normalized.includes('/.output/')
      || normalized.includes('/node_modules/')
      || normalized.includes('/eslint-rules/')
      || normalized.includes('/scripts/')
      || normalized.endsWith('/index.ts')
      || normalized.includes('/types/')
    ) {
      return {}
    }

    // Only target app/ and server/ utils / composables
    if (!normalized.includes('/app/utils/') && !normalized.includes('/server/utils/') && !normalized.includes('/app/composables/')) {
      return {}
    }

    const sourceCode = context.sourceCode

    if (!sourceCode) return {}

    return {
      'Program:exit'(node) {
        const body = node.body

        // If body is very short and consists ONLY of ExportNamedDeclaration with source (re-export)
        if (body.length > 0 && body.length <= 4) {
          const allReExports = body.every(
            statement => statement.type === 'ExportNamedDeclaration' && statement.source !== null,
          )

          if (allReExports) {
            context.report({
              node,
              loc: { line: 1, column: 0 },
              messageId: 'noTrivialFacade',
            })
          }
        }
      },
    }
  },
}
