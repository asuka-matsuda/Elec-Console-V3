/**
 * no-page-scoped-css
 * [ESLint Custom Rule]
 * テンプレート層以降（Pages / Layouts / 画面タブ・モーダルテンプレート）における
 * <style> / <style scoped> ブロックの記述を禁止するルール。
 *
 * 画面・テンプレート層では以下の3つのみでUIを構築し、個別CSSの乱立を防ぎます:
 * 1. 凍結済み共通コンポーネント（app/components/common）
 * 2. Foundation セマンティック要素・クラス（.panel, .divider, .label, strong, small, code 等）
 * 3. Tailwind レイアウトユーティリティ（flex, grid, gap-*, p-* 等）
 */

const TARGET_PATH_PATTERNS = [
  /\/app\/pages\/.*\.vue$/,
  /\/app\/layouts\/.*\.vue$/,
  /\/app\/components\/master\/.*\.vue$/,
  /\/app\/components\/portal\/admin\/.*\.vue$/,
  /\/app\/components\/portal\/reports\/.*\.vue$/,
  /\/app\/components\/portal\/souden\/.*\.vue$/,
  /\/app\/components\/portal\/calendar\/ModalCalendarEvent\.vue$/,
  /\/app\/components\/portal\/calendar\/ModalCalendarTypeSettings\.vue$/,
]

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow <style> blocks in pages, layouts, and template-level components',
    },
    messages: {
      forbiddenStyleBlock: 'ページ・レイアウト・テンプレート層での <style> ブロックの記述は禁止されています。共通コンポーネント（app/components/common）、Foundation セマンティッククラス（.panel, strong, small, code 等）、および Tailwind レイアウトクラスのみで記述してください。',
    },
    schema: [],
  },
  create(context) {
    const filename = (context.filename || context.getFilename()).replace(/\\/g, '/')

    const isTarget = TARGET_PATH_PATTERNS.some(regex => regex.test(filename))

    if (!isTarget) return {}

    return {
      Program() {
        const sourceCode = context.sourceCode || context.getSourceCode()
        const text = sourceCode.getText()

        const styleRegex = /<style\b[^>]*>/g
        let match

        while ((match = styleRegex.exec(text)) !== null) {
          const loc = sourceCode.getLocFromIndex(match.index)

          context.report({
            loc: {
              start: loc,
              end: { line: loc.line, column: loc.column + match[0].length },
            },
            messageId: 'forbiddenStyleBlock',
          })
        }
      },
    }
  },
}
