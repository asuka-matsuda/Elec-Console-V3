/**
 * strict-empty-state-usage
 * [ESLint Custom Rule]
 * Vercel Geist EmptyState ベストプラクティスに準拠した厳格な使用監視ルール
 * （※支援アクセシビリティ関連属性はプロジェクト規約により除外）
 *
 * 監視項目:
 * 1. 直角規約違反（rounded-* クラスの付与禁止）
 * 2. バリアントの検証（default / no-results / informational / cleared / permission / error のみ許可）
 * 3. サイズ指定の検証（sm / md / lg のみ許可）
 * 4. 支援アクセシビリティ属性の禁止（aria-*, role 等の付与禁止。プロジェクト規約準拠）
 * 5. コンテンツ指定の検証（title, description, icon prop または対応スロットのいずれかを必須化）
 */

const VALID_VARIANTS = new Set([
  'default',
  'no-results',
  'informational',
  'cleared',
  'permission',
  'error',
])

const VALID_SIZES = new Set(['sm', 'md', 'lg'])

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Vercel Geist EmptyState best practices strictly',
    },
    messages: {
      forbiddenRoundedClass: '<EmptyState> に対する「{{ token }}」は直角規約（border-radius: 0）により禁止されています。',
      invalidVariant: '<EmptyState> の variant「{{ variant }}」は無効です。使用可能なバリアントは default / no-results / informational / cleared / permission / error のみです。',
      invalidSize: '<EmptyState> の size「{{ size }}」は無効です。使用可能なサイズは sm / md / lg のみです。',
      noAccessibility: '<EmptyState> への純粋な支援アクセシビリティ属性（{{ attr }}）の付与はプロジェクト規約により禁止されています。',
      missingContent: '<EmptyState> には title, description, icon prop、または対応スロットで空状態の内容を指定してください。',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename()

    // EmptyState.vue 自体はスキップ
    if (filename.endsWith('EmptyState.vue')) {
      return {}
    }

    const parserServices = context.sourceCode?.parserServices || context.parserServices

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {}
    }

    return parserServices.defineTemplateBodyVisitor({
      VElement(node) {
        const isEmptyState = node.rawName === 'EmptyState' || node.name === 'EmptyState' || node.name === 'common-molecules-empty-state'

        if (!isEmptyState) return

        const attributes = node.startTag?.attributes || []
        let hasContentProp = false

        for (const attr of attributes) {
          const isDirective = Boolean(attr.directive)
          const propName = isDirective ? attr.key?.argument?.name : attr.key?.name
          const rawVal = attr.value?.value

          if (propName === 'title' || propName === 'description' || propName === 'icon') {
            hasContentProp = true
          }

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

          // 2. variant の検査
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

          // 3. size の検査
          if (propName === 'size' && !isDirective && typeof rawVal === 'string') {
            const sizeVal = rawVal.trim()

            if (!VALID_SIZES.has(sizeVal)) {
              context.report({
                node: attr,
                messageId: 'invalidSize',
                data: { size: sizeVal },
              })
            }
          }

          // 4. 支援アクセシビリティ属性の禁止
          if (propName && (propName.startsWith('aria-') || propName === 'role')) {
            context.report({
              node: attr,
              messageId: 'noAccessibility',
              data: { attr: propName },
            })
          }
        }

        // 5. スロットの検査
        let hasContentSlot = false
        const children = node.children || []

        for (const child of children) {
          if (child.type === 'VElement') {
            const childName = child.rawName || child.name

            if (childName === 'template') {
              const childAttrs = child.startTag?.attributes || []

              for (const childAttr of childAttrs) {
                if (childAttr.directive && (childAttr.key?.name?.name === 'slot' || childAttr.key?.name === 'slot')) {
                  const slotName = childAttr.key?.argument?.name

                  if (slotName === 'title' || slotName === 'description' || slotName === 'icon' || slotName === 'default') {
                    hasContentSlot = true
                  }
                }
              }
            }
          }
        }

        if (!hasContentProp && !hasContentSlot) {
          context.report({
            node,
            messageId: 'missingContent',
          })
        }
      },
    })
  },
}
