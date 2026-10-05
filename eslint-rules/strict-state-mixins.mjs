/**
 * strict-state-mixins
 * [ESLint Custom Rule]
 *
 * 定義済みの3大状態管理 Mixin（state-interactive, state-loading, state-disabled）が
 * 担当する振る舞い（cursor: pointer, user-select: none, cursor: not-allowed, cursor: wait 等）を
 * コンポーネント内の Scoped CSS で直接ハードコードすることを禁止し、
 * プロジェクト共通 Mixin の使用を一貫して強制するルール。
 */

function maskComments(str) {
  return str
    .replace(/\/\*[\s\S]*?\*\//g, match => ' '.repeat(match.length))
    .replace(/\/\/[^\n\r]*/g, match => ' '.repeat(match.length))
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce usage of state mixins instead of hardcoding cursor or interactive behaviors',
    },
    messages: {
      hardcodedInteractive: '状態属性「{{ token }}」の直接記述は禁止されています。状態管理共通 Mixin「@include state-interactive;」を使用してください。',
      hardcodedDisabled: '無効状態属性「{{ token }}」の直接記述は禁止されています。状態管理共通 Mixin「@include state-disabled;」を使用してください。',
      hardcodedLoading: 'ローディング状態属性「{{ token }}」の直接記述は禁止されています。状態管理共通 Mixin「@include state-loading;」を使用してください。',
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
          const rawContent = styleMatch[1]
          const styleStartIndex = styleMatch.index + styleMatch[0].indexOf(rawContent)
          const maskedContent = maskComments(rawContent)

          // 1. state-interactive のハードコード検査 (cursor: pointer)
          // ※ user-select: none は静的コンポーネント（Avatar文字反転防止等）でも正当に使われるため除外
          const interactiveRegex = /(?<![\w-])cursor\s*:\s*pointer\b/g
          let m

          while ((m = interactiveRegex.exec(maskedContent)) !== null) {
            const offset = styleStartIndex + m.index
            const loc = sourceCode.getLocFromIndex(offset)

            context.report({
              loc: {
                start: loc,
                end: { line: loc.line, column: loc.column + m[0].length },
              },
              messageId: 'hardcodedInteractive',
              data: { token: m[0].trim() },
            })
          }

          // 2. state-disabled のハードコード検査 (cursor: not-allowed)
          const disabledRegex = /(?<![\w-])cursor\s*:\s*not-allowed\b/g

          while ((m = disabledRegex.exec(maskedContent)) !== null) {
            const offset = styleStartIndex + m.index
            const loc = sourceCode.getLocFromIndex(offset)

            context.report({
              loc: {
                start: loc,
                end: { line: loc.line, column: loc.column + m[0].length },
              },
              messageId: 'hardcodedDisabled',
              data: { token: m[0].trim() },
            })
          }

          // 3. state-loading のハードコード検査 (cursor: wait)
          const loadingRegex = /(?<![\w-])cursor\s*:\s*wait\b/g

          while ((m = loadingRegex.exec(maskedContent)) !== null) {
            const offset = styleStartIndex + m.index
            const loc = sourceCode.getLocFromIndex(offset)

            context.report({
              loc: {
                start: loc,
                end: { line: loc.line, column: loc.column + m[0].length },
              },
              messageId: 'hardcodedLoading',
              data: { token: m[0].trim() },
            })
          }
        }
      },
    }
  },
}
