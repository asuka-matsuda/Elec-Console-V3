/**
 * strict-toast-usage
 * [ESLint Custom Rule]
 * Vercel Geist Toast ベストプラクティスに準拠した厳格な使用監視ルール
 * （※支援アクセシビリティ関連属性はプロジェクト規約により除外）
 *
 * 監視項目:
 * 1. 直角規約違反（<Toast> に対する rounded-* クラスの付与禁止）
 * 2. 支援アクセシビリティ属性の禁止（aria-*, role 等の付与禁止。プロジェクト規約準拠）
 * 3. バリアントの検証（useToast の add/type での不正バリアントの遮断: default / info / success / warning / danger のみ許可）
 */

const VALID_TOAST_TYPES = new Set(['default', 'info', 'success', 'warning', 'danger'])

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Vercel Geist Toast best practices strictly',
    },
    messages: {
      forbiddenRoundedClass: '<Toast> に対する「{{ token }}」は直角規約（border-radius: 0）により禁止されています。',
      noAccessibility: '<Toast> への純粋な支援アクセシビリティ属性（{{ attr }}）の付与はプロジェクト規約により禁止されています。',
      invalidToastType: 'Toast の type「{{ type }}」は無効です。使用可能なバリアントは default / info / success / warning / danger のみです。',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename()

    // Toast.vue / ToastContainer.vue 自体は内部実装のため除外
    if (filename.endsWith('Toast.vue') || filename.endsWith('ToastContainer.vue')) {
      return {}
    }

    const parserServices = context.sourceCode?.parserServices || context.parserServices

    const visitors = {
      // スクリプト内の toast.add({ type: '...' }) の静的検証
      CallExpression(node) {
        if (
          node.callee?.type === 'MemberExpression'
          && node.callee.property?.name === 'add'
          && node.arguments?.[0]?.type === 'ObjectExpression'
        ) {
          const typeProp = node.arguments[0].properties.find(
            p => p.type === 'Property' && (p.key.name === 'type' || p.key.value === 'type'),
          )

          if (typeProp && typeProp.value?.type === 'Literal' && typeof typeProp.value.value === 'string') {
            const toastType = typeProp.value.value.trim()

            if (!VALID_TOAST_TYPES.has(toastType)) {
              context.report({
                node: typeProp,
                messageId: 'invalidToastType',
                data: { type: toastType },
              })
            }
          }
        }
      },
    }

    if (parserServices?.defineTemplateBodyVisitor) {
      return parserServices.defineTemplateBodyVisitor(
        {
          VElement(node) {
            const isToast = node.rawName === 'Toast' || node.name === 'Toast'
              || node.rawName === 'ToastContainer' || node.name === 'ToastContainer'
              || node.name === 'common-molecules-toast' || node.name === 'common-molecules-toast-container'

            if (!isToast) return

            const attributes = node.startTag?.attributes || []

            for (const attr of attributes) {
              const isDirective = Boolean(attr.directive)
              const propName = isDirective ? attr.key?.argument?.name : attr.key?.name
              const rawVal = attr.value?.value

              // 1. クラス属性の検査 (角丸の禁止)
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

              // 2. 支援アクセシビリティ属性の禁止
              if (propName && (propName.startsWith('aria-') || propName === 'role')) {
                context.report({
                  node: attr,
                  messageId: 'noAccessibility',
                  data: { attr: propName },
                })
              }
            }
          },
        },
        visitors,
      )
    }

    return visitors
  },
}
