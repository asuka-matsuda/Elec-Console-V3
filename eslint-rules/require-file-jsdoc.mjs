/**
 * require-file-jsdoc
 * [ESLint Custom Rule]
 * 主要ディレクトリ配下のファイル先頭に JSDoc コメント (/** ... *\/) が
 * 記述されていることを厳格に義務付けるルール。
 * - Vue SFC: <script setup> の直後の最初の非空行が /** で始まり、概要説明を含むこと
 * - TypeScript: ファイルの最初の非空行（import より前）が /** で始まり、概要説明を含むこと
 * - コンポーネント整合性: app/components 配下では JSDoc 1 行目の名前がファイル名と完全一致すること
 */

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require strict leading JSDoc comments on server, composables, pages, components, utils, constants, middleware, plugins, and types',
    },
    messages: {
      missingLeadingJsDoc: 'ファイル先頭（Vue は <script setup> 直後、TS は 1 行目の import より前）に概要や仕様を説明する JSDoc コメント (/** ... */) を記述してください。',
      invalidJsDocContent: 'ファイル先頭の JSDoc には、ファイルやモジュールの概要・仕様を日本語で具体的に記述してください（空のコメントは不可）。',
      mismatchedComponentName: 'コンポーネント JSDoc の 1 行目名「{{ docName }}」がファイル名「{{ expectedName }}」と一致していません。ファイル名と完全一致させてください。',
    },
    schema: [],
  },
  create(context) {
    const rawFilename = context.filename || context.physicalFilename || ''
    const normalized = rawFilename.replace(/\\/g, '/')

    // Exclude tests, build outputs, and node_modules
    if (
      normalized.includes('/tests/')
      || normalized.includes('/e2e/')
      || normalized.includes('/.nuxt/')
      || normalized.includes('/.output/')
      || normalized.includes('/node_modules/')
      || normalized.includes('/eslint-rules/')
      || normalized.includes('/scripts/')
    ) {
      return {}
    }

    const TARGET_DIRS = [
      '/server/api/',
      '/server/utils/',
      '/server/plugins/',
      '/server/middleware/',
      '/app/composables/',
      '/app/pages/',
      '/app/components/',
      '/app/utils/',
      '/app/constants/',
      '/app/middleware/',
      '/app/plugins/',
      '/app/types/',
      '/app/layouts/',
    ]

    const isTarget
      = TARGET_DIRS.some(dir => normalized.includes(dir))
        || normalized.endsWith('/app/app.vue')
        || normalized.endsWith('/error.vue')
        || normalized.includes('/shared/types/')

    if (!isTarget) {
      return {}
    }

    const sourceCode = context.sourceCode

    if (!sourceCode) return {}

    return {
      'Program:exit'(node) {
        const text = sourceCode.getText()
        const lines = text.split(/\r?\n/)

        // Helper to validate JSDoc content
        const validateJsDoc = (startIdx, targetLine) => {
          const jsdocLines = []
          let closed = false

          for (let i = startIdx; i < lines.length; i++) {
            jsdocLines.push(lines[i])
            if (lines[i].includes('*/')) {
              closed = true
              break
            }
          }

          if (!closed) {
            context.report({
              node,
              loc: { line: targetLine, column: 0 },
              messageId: 'invalidJsDocContent',
            })

            return false
          }

          // Check component name match for app/components
          if (normalized.includes('/app/components/')) {
            const fileNameMatch = normalized.match(/\/([^/]+)\.vue$/)

            if (fileNameMatch) {
              const expectedName = fileNameMatch[1].replace(/\.client$/, '')
              const firstDocLine = jsdocLines[1] || ''
              const docName = firstDocLine.replace(/^\s*\*\s*/, '').trim()

              if (docName !== expectedName) {
                context.report({
                  node,
                  loc: { line: startIdx + 2, column: 0 },
                  messageId: 'mismatchedComponentName',
                  data: {
                    docName,
                    expectedName,
                  },
                })
              }
            }
          }

          // Check meaningful text inside JSDoc
          const innerText = jsdocLines
            .join('\n')
            .replace(/\/\*\*|\*\/|\*/g, '')
            .replace(/@\w+/g, '')
            .trim()

          // Must have at least 4 characters and contain Japanese text
          const hasJapanese = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFF9F\u4E00-\u9FAF]/.test(innerText)

          if (innerText.length < 4 || !hasJapanese) {
            context.report({
              node,
              loc: { line: targetLine, column: 0 },
              messageId: 'invalidJsDocContent',
            })

            return false
          }

          return true
        }

        if (normalized.endsWith('.vue')) {
          const scriptSetupIdx = lines.findIndex(l => l.includes('<script'))

          // If no script tag exists at all, require it for JSDoc documentation
          if (scriptSetupIdx === -1) {
            context.report({
              node,
              loc: { line: 1, column: 0 },
              messageId: 'missingLeadingJsDoc',
            })

            return
          }

          let nextNonEmpty = ''
          let targetLine = scriptSetupIdx + 1
          let targetIdx = -1

          for (let i = scriptSetupIdx + 1; i < lines.length; i++) {
            if (lines[i].trim().length > 0) {
              nextNonEmpty = lines[i].trim()
              targetLine = i + 1
              targetIdx = i
              break
            }
          }

          if (!nextNonEmpty.startsWith('/**')) {
            context.report({
              node,
              loc: { line: targetLine, column: 0 },
              messageId: 'missingLeadingJsDoc',
            })

            return
          }

          validateJsDoc(targetIdx, targetLine)
        }
        else if (normalized.endsWith('.ts')) {
          let firstNonEmpty = ''
          let targetLine = 1
          let targetIdx = -1

          for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().length > 0) {
              firstNonEmpty = lines[i].trim()
              targetLine = i + 1
              targetIdx = i
              break
            }
          }

          if (!firstNonEmpty.startsWith('/**')) {
            context.report({
              node,
              loc: { line: targetLine, column: 0 },
              messageId: 'missingLeadingJsDoc',
            })

            return
          }

          validateJsDoc(targetIdx, targetLine)
        }
      },
    }
  },
}
