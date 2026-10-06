/**
 * strict-switch-usage
 * [ESLint Custom Rule]
 * Vercel Geist Switch (Toggle) ベストプラクティスに準拠した厳格な使用監視ルール
 * （※支援アクセシビリティ関連属性はプロジェクト規約により除外）
 *
 * 監視項目:
 * 1. 直角規約違反（rounded-* クラスの付与禁止）
 * 2. サイズ指定の検証（sm / md / lg のみ許可）
 * 3. カラー指定の検証（default / blue / amber / green / red / purple のみ許可）
 * 4. 外部からの寸法・余白上書き禁止（h-*, w-*, p-* 等の付与禁止）
 * 5. 支援アクセシビリティ属性の禁止（aria-*, role 等の付与禁止。プロジェクト規約準拠）
 * 6. ラベルの担保（label 属性またはスロットコンテンツの指定を推奨）
 */

const VALID_SIZES = new Set(['sm', 'md', 'lg'])
const VALID_COLORS = new Set(['default', 'blue', 'amber', 'green', 'red', 'purple'])

const PADDING_PATTERN = /^p[xytrbl]?-/
const DIMENSION_PATTERN = /^[hw]-(auto|full|screen|\d+|\[.+\])$/

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Vercel Geist Switch (Toggle) best practices strictly',
    },
    messages: {
      forbiddenRoundedClass: '<Switch> に対する「{{ token }}」は直角規約（border-radius: 0）により禁止されています。トラックおよびサムは直角で描画してください。',
      invalidSize: '<Switch> の size「{{ size }}」は無効です。使用可能なサイズは sm / md / lg のみです。',
      invalidColor: '<Switch> の color「{{ color }}」は無効です。使用可能なカラーは default / blue / amber / green / red / purple です。',
      forbiddenOverrideClass: '<Switch> に対する寸法・パディングクラス「{{ token }}」は禁止されています。サイズは size="sm | md | lg" prop によって自動同期されます。',
      noAccessibility: '<Switch> への純粋な支援アクセシビリティ属性（{{ attr }}）の付与はプロジェクト規約により禁止されています。',
      emptySwitchLabel: '<Switch> には label 属性または子要素スロット（状態名）の指定が推奨されます。',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename()

    // Switch.vue 自体はスキップ
    if (filename.endsWith('Switch.vue')) {
      return {}
    }

    const parserServices = context.sourceCode?.parserServices || context.parserServices

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {}
    }

    return parserServices.defineTemplateBodyVisitor({
      VElement(node) {
        const isSwitch = node.rawName === 'Switch' || node.name === 'Switch' || node.name === 'common-atoms-switch'

        if (!isSwitch) return

        const attributes = node.startTag?.attributes || []
        let hasLabel = false

        for (const attr of attributes) {
          const isDirective = Boolean(attr.directive)
          const propName = isDirective ? attr.key?.argument?.name : attr.key?.name
          const rawVal = attr.value?.value

          // 1. サイズの検査
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

          // 2. カラーの検査
          if (propName === 'color' && !isDirective && typeof rawVal === 'string') {
            const colorVal = rawVal.trim()

            if (!VALID_COLORS.has(colorVal)) {
              context.report({
                node: attr,
                messageId: 'invalidColor',
                data: { color: colorVal },
              })
            }
          }

          // 3. クラス属性の検査 (角丸・寸法・余白の上書き禁止)
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
              else if (DIMENSION_PATTERN.test(token) || PADDING_PATTERN.test(token)) {
                context.report({
                  node: attr,
                  messageId: 'forbiddenOverrideClass',
                  data: { token },
                })
              }
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

          if (propName === 'label') {
            hasLabel = true
          }
        }

        // 5. ラベルまたは子要素の存在確認
        const hasChildren = node.children && node.children.some((c) => {
          if (c.type === 'VText') return c.value.trim().length > 0
          if (c.type === 'VElement') return true

          return false
        })

        if (!hasLabel && !hasChildren) {
          context.report({
            node,
            messageId: 'emptySwitchLabel',
          })
        }
      },
    })
  },
}
