/**
 * strict-menu-usage
 * [ESLint Custom Rule]
 * Vercel Geist Menu ベストプラクティスに準拠した厳格な使用監視ルール
 * （※支援アクセシビリティ関連属性はプロジェクト規約により除外）
 *
 * 監視項目:
 * 1. 旧コンポーネント名 <DropdownMenu> の使用禁止（<Menu> への統一）
 * 2. 直角規約違反（<Menu> に対する rounded-* クラスの付与禁止）
 * 3. 支援アクセシビリティ属性の禁止（aria-*, role 等の付与禁止。プロジェクト規約準拠）
 * 4. サイズ指定の検証（sm / md / lg のみ許可）
 */

const VALID_SIZES = new Set(['sm', 'md', 'lg'])

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Vercel Geist Menu best practices strictly',
    },
    messages: {
      deprecatedComponent: '「<DropdownMenu>」は非推奨です。Vercel Geist 準拠の「<Menu>」を使用してください。',
      forbiddenRoundedClass: '<Menu> に対する「{{ token }}」は直角規約（border-radius: 0）により禁止されています。',
      invalidSize: '<Menu> の size「{{ size }}」は無効です。使用可能なサイズは sm / md / lg のみです。',
      noAccessibility: '<Menu> への純粋な支援アクセシビリティ属性（{{ attr }}）の付与はプロジェクト規約により禁止されています。',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename()

    // Menu.vue 自体は内部実装のため除外
    if (filename.endsWith('Menu.vue')) {
      return {}
    }

    const parserServices = context.sourceCode?.parserServices || context.parserServices

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {}
    }

    return parserServices.defineTemplateBodyVisitor({
      VElement(node) {
        // 1. 旧 DropdownMenu の検知
        if (node.rawName === 'DropdownMenu' || node.name === 'DropdownMenu' || node.name === 'common-molecules-dropdown-menu') {
          context.report({
            node,
            messageId: 'deprecatedComponent',
          })

          return
        }

        const isMenu = node.rawName === 'Menu' || node.name === 'Menu' || node.name === 'common-molecules-menu'

        if (!isMenu) return

        const attributes = node.startTag?.attributes || []

        for (const attr of attributes) {
          const isDirective = Boolean(attr.directive)
          const propName = isDirective ? attr.key?.argument?.name : attr.key?.name
          const rawVal = attr.value?.value

          // 2. クラス属性の検査 (角丸の禁止)
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
      },
    })
  },
}
