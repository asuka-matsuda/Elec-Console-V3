/**
 * strict-input-usage
 * [ESLint Custom Rule]
 * Vercel Geist Input / ClearableInput ベストプラクティスに準拠した厳格な使用監視ルール
 * （※支援アクセシビリティ関連属性はプロジェクト規約により除外）
 *
 * 監視項目:
 * 1. 直角規約違反（rounded-* クラスの付与禁止）
 * 2. サイズ指定の検証（sm / md / lg 以外は禁止）
 */

const VALID_SIZES = new Set(['sm', 'md', 'lg'])

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Vercel Geist Input / ClearableInput best practices strictly',
    },
    messages: {
      invalidSize: '<{{ component }}> の size「{{ size }}」は無効です。使用可能なサイズは sm / md / lg のみです。',
      forbiddenRoundedClass: '<{{ component }}> に対する「{{ token }}」は直角規約（border-radius: 0）により禁止されています。',
    },
    schema: [],
  },
  create(context) {
    const parserServices = context.sourceCode?.parserServices || context.parserServices

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {}
    }

    return parserServices.defineTemplateBodyVisitor({
      VElement(node) {
        const isInput = node.rawName === 'Input' || node.name === 'Input' || node.name === 'input'
        const isClearableInput = node.rawName === 'ClearableInput' || node.name === 'ClearableInput' || node.name === 'clearable-input'

        if (!isInput && !isClearableInput) return

        const componentName = isClearableInput ? 'ClearableInput' : 'Input'
        const attributes = node.startTag?.attributes || []

        for (const attr of attributes) {
          const isDirective = Boolean(attr.directive)
          const propName = isDirective ? attr.key?.argument?.name : attr.key?.name
          const rawVal = attr.value?.value

          // --- 1. サイズの検査 ---
          if (propName === 'size' && !isDirective && typeof rawVal === 'string') {
            const sizeVal = rawVal.trim()

            if (!VALID_SIZES.has(sizeVal)) {
              context.report({
                node: attr,
                messageId: 'invalidSize',
                data: { component: componentName, size: sizeVal },
              })
            }
          }

          // --- 2. クラスの検査 (rounded-* の禁止) ---
          if (propName === 'class' && !isDirective && typeof rawVal === 'string') {
            const tokens = rawVal.split(/\s+/).filter(Boolean)

            for (const token of tokens) {
              if (token.startsWith('rounded')) {
                context.report({
                  node: attr,
                  messageId: 'forbiddenRoundedClass',
                  data: { component: componentName, token },
                })
              }
            }
          }
        }
      },
    })
  },
}
