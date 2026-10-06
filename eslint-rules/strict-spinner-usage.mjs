/**
 * strict-spinner-usage
 * [ESLint Custom Rule]
 * Vercel Geist Spinner ベストプラクティスに準拠した厳格な使用監視ルール
 * （※支援アクセシビリティ関連属性はプロジェクト規約により除外）
 *
 * 監視項目:
 * 1. 直角規約違反（rounded-* クラスの付与禁止）
 * 2. サイズ指定の検証（sm / md / lg または数値のみ許可）
 * 3. 外部からの寸法上書き禁止（h-*, w-* の直接付与禁止。size prop を使用）
 * 4. 支援アクセシビリティ属性の禁止（aria-*, role 等の付与禁止。プロジェクト規約準拠）
 */

const VALID_SIZES = new Set(['sm', 'md', 'lg'])
const DIMENSION_PATTERN = /^[hw]-(auto|full|screen|\d+|\[.+\])$/

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Vercel Geist Spinner best practices strictly',
    },
    messages: {
      forbiddenRoundedClass: '<Spinner> に対する「{{ token }}」は直角規約（border-radius: 0）により禁止されています。',
      invalidSize: '<Spinner> の size「{{ size }}」は無効です。使用可能なサイズは sm / md / lg または数値pxのみです。',
      forbiddenOverrideClass: '<Spinner> に対する寸法クラス「{{ token }}」は禁止されています。サイズは size="sm | md | lg | {number}" prop によって自動同期されます。',
      noAccessibility: '<Spinner> への純粋な支援アクセシビリティ属性（{{ attr }}）の付与はプロジェクト規約により禁止されています。',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename()

    // Spinner.vue 自体はスキップ
    if (filename.endsWith('Spinner.vue')) {
      return {}
    }

    const parserServices = context.sourceCode?.parserServices || context.parserServices

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {}
    }

    return parserServices.defineTemplateBodyVisitor({
      VElement(node) {
        const isSpinner = node.rawName === 'Spinner' || node.name === 'Spinner' || node.name === 'common-atoms-spinner'

        if (!isSpinner) return

        const attributes = node.startTag?.attributes || []

        for (const attr of attributes) {
          const isDirective = Boolean(attr.directive)
          const propName = isDirective ? attr.key?.argument?.name : attr.key?.name
          const rawVal = attr.value?.value

          // 1. 静的文字列サイズの検査
          if (propName === 'size' && !isDirective && typeof rawVal === 'string') {
            const sizeVal = rawVal.trim()

            if (!VALID_SIZES.has(sizeVal) && Number.isNaN(Number(sizeVal))) {
              context.report({
                node: attr,
                messageId: 'invalidSize',
                data: { size: sizeVal },
              })
            }
          }

          // 2. クラス属性の検査 (角丸・寸法の上書き禁止)
          if (propName === 'class' && !isDirective && typeof rawVal === 'string') {
            const tokens = rawVal.split(/\s+/).filter(Boolean)

            for (const token of tokens) {
              if (token.startsWith('rounded')) {
                context.report({
                  node: attr,
                  messageId: 'forbiddenRoundedClass',
                  data: { token },
                })
              }
              else if (DIMENSION_PATTERN.test(token)) {
                context.report({
                  node: attr,
                  messageId: 'forbiddenOverrideClass',
                  data: { token },
                })
              }
            }
          }

          // 3. 支援アクセシビリティ属性の禁止
          if (propName && (propName.startsWith('aria-') || propName === 'role')) {
            context.report({
              node: attr,
              messageId: 'noAccessibility',
              data: { attr: propName },
            })
          }
        }
      },
    })
  },
}
