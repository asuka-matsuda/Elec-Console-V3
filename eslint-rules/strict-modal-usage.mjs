/**
 * strict-modal-usage
 * [ESLint Custom Rule]
 * Vercel Geist Modal ベストプラクティスに準拠した厳格な使用監視ルール
 * （※支援アクセシビリティ関連属性はプロジェクト規約により除外）
 *
 * 監視項目:
 * 1. 直角規約違反（<Modal> に対する rounded-* クラスの付与禁止）
 * 2. 支援アクセシビリティ属性の禁止（aria-*, role 等の付与禁止。プロジェクト規約準拠）
 * 3. サイズ指定の検証（sm / md / lg / full のみ許可）
 */

const VALID_SIZES = new Set(['sm', 'md', 'lg', 'full'])

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Vercel Geist Modal best practices strictly',
    },
    messages: {
      forbiddenRoundedClass: '<Modal> に対する「{{ token }}」は直角規約（border-radius: 0）により禁止されています。',
      invalidSize: '<Modal> の size「{{ size }}」は無効です。使用可能なサイズは sm / md / lg / full のみです。',
      noAccessibility: '<Modal> への純粋な支援アクセシビリティ属性（{{ attr }}）の付与はプロジェクト規約により禁止されています。',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename()

    // Modal.vue 自体は内部実装のため除外
    if (filename.endsWith('Modal.vue')) {
      return {}
    }

    const parserServices = context.sourceCode?.parserServices || context.parserServices

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {}
    }

    return parserServices.defineTemplateBodyVisitor({
      VElement(node) {
        const isModal = node.rawName === 'Modal' || node.name === 'Modal' || node.name === 'common-organisms-modal'

        if (!isModal) return

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

          // 3. size prop の静的値検証
          if (!attr.directive && attr.key?.name === 'size' && attr.value?.value) {
            const sizeVal = String(attr.value.value)

            if (!VALID_SIZES.has(sizeVal)) {
              context.report({
                node: attr,
                messageId: 'invalidSize',
                data: { size: sizeVal },
              })
            }
          }
        }
      },
    })
  },
}
