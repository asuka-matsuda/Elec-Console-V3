/**
 * strict-table-usage
 * [ESLint Custom Rule]
 * Vercel Geist Table ベストプラクティスに準拠した厳格な使用監視ルール
 * （※支援アクセシビリティ関連属性はプロジェクト規約により除外）
 *
 * 監視項目:
 * 1. 直角規約違反（<Table> に対する rounded-* クラスの付与禁止）
 * 2. 支援アクセシビリティ属性の禁止（aria-*, role 等の付与禁止。プロジェクト規約準拠）
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Vercel Geist Table best practices strictly',
    },
    messages: {
      forbiddenRoundedClass: '<Table> に対する「{{ token }}」は直角規約（border-radius: 0）により禁止されています。',
      noAccessibility: '<Table> への純粋な支援アクセシビリティ属性（{{ attr }}）の付与はプロジェクト規約により禁止されています。',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename()

    // Table.vue 自体は内部実装のため除外
    if (filename.endsWith('Table.vue')) {
      return {}
    }

    const parserServices = context.sourceCode?.parserServices || context.parserServices

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {}
    }

    return parserServices.defineTemplateBodyVisitor({
      VElement(node) {
        const isTable = node.rawName === 'Table' || node.name === 'Table' || node.name === 'common-molecules-table'

        if (!isTable) return

        const attributes = node.startTag?.attributes || []

        for (const attr of attributes) {
          // 1. 支援アクセシビリティ属性の監視
          const attrName = attr.directive ? attr.key?.argument?.name : attr.key?.name

          if (attrName) {
            if (attrName.startsWith('aria-') || attrName === 'role') {
              context.report({
                node: attr,
                messageId: 'noAccessibility',
                data: { attr: attrName },
              })
            }
          }

          // 2. 直角規約の監視（静的 class）
          if (!attr.directive && attr.key?.name === 'class' && attr.value?.value) {
            const classTokens = String(attr.value.value).split(/\s+/)

            for (const token of classTokens) {
              if (token.startsWith('rounded') || token.includes(':rounded')) {
                context.report({
                  node: attr,
                  messageId: 'forbiddenRoundedClass',
                  data: { token },
                })
              }
            }
          }
        }
      },
    })
  },
}
