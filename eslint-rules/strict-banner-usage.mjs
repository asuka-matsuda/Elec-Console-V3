/**
 * strict-banner-usage
 * [ESLint Custom Rule]
 * Vercel Geist Banner ベストプラクティスに準拠した厳格な使用監視ルール
 * （※支援アクセシビリティ関連属性はプロジェクト規約により除外）
 *
 * 監視項目:
 * 1. バリアントの検証（gray / warning / success / danger のみ許可）
 * 2. 直角規約違反（rounded-* クラスの付与禁止）
 * 3. 必須コンテンツの担保（title props またはスロットコンテンツのいずれかが必須）
 */

const VALID_VARIANTS = new Set(['gray', 'warning', 'success', 'danger'])

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Vercel Geist Banner best practices strictly',
    },
    messages: {
      invalidVariant: '<Banner> の variant「{{ variant }}」は無効です。使用可能なバリアントは gray / warning / success / danger のみです。',
      forbiddenRoundedClass: '<Banner> に対する「{{ token }}」は直角規約（border-radius: 0）により禁止されています。全幅バナーは直角で描画してください。',
      emptyBanner: '<Banner> には title 属性または子要素スロット（告知内容）の指定が必須です。',
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
        const isBanner = node.rawName === 'Banner' || node.name === 'Banner' || node.name === 'banner'

        if (!isBanner) return

        const attributes = node.startTag?.attributes || []
        let hasTitle = false

        for (const attr of attributes) {
          const isDirective = Boolean(attr.directive)
          const propName = isDirective ? attr.key?.argument?.name : attr.key?.name
          const rawVal = attr.value?.value

          // --- 1. バリアントの検査 ---
          if (propName === 'variant' && !isDirective && typeof rawVal === 'string') {
            const variantVal = rawVal.trim()

            if (!VALID_VARIANTS.has(variantVal)) {
              context.report({
                node: attr,
                messageId: 'invalidVariant',
                data: { variant: variantVal },
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
                  data: { token },
                })
              }
            }
          }

          if (propName === 'title') {
            hasTitle = true
          }
        }

        // --- 3. 必須コンテンツの担保 ---
        const hasChildren = node.children && node.children.some((c) => {
          if (c.type === 'VText') return c.value.trim().length > 0
          if (c.type === 'VElement') return true

          return false
        })

        if (!hasTitle && !hasChildren) {
          context.report({
            node,
            messageId: 'emptyBanner',
          })
        }
      },
    })
  },
}
