/**
 * strict-avatar-usage
 * [ESLint Custom Rule]
 * Vercel Geist Avatar ベストプラクティスに準拠した厳格な使用監視ルール
 * （※支援アクセシビリティ関連属性はプロジェクト規約により除外）
 *
 * 監視項目:
 * 1. 無効なサイズの禁止（sm / md / lg のみ許可）
 * 2. 直角規約違反（rounded-* クラスの付与禁止）
 * 3. 不正なテキスト・文章の禁止（長文文章やエラーメッセージの混入禁止）
 * 4. 不正な子要素挿入の禁止（props 完結構造の維持）
 */

const VALID_SIZES = new Set(['sm', 'md', 'lg'])

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Vercel Geist Avatar best practices strictly',
    },
    messages: {
      invalidSize: '<Avatar> のサイズ「{{ size }}」は無効です。使用可能なサイズは sm / md / lg のみです。',
      forbiddenRoundedClass: '<Avatar> に対する「{{ token }}」は規約違反です。アバターは真円（border-radius: var(--radius-circle)）が内部で適用されているため外部クラスによる角丸指定は禁止されています。',
      noSentence: '<Avatar> の text 属性に文章やエラーメッセージを入れることは禁止されています（"{{ text }}"）。1〜2文字のイニシャルまたは短い名前を指定してください。',
      noChildren: '<Avatar> は自己完結コンポーネントです。子要素の挿入は禁止されています（props: src, text, alt, size を使用してください）。',
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
        const isAvatar = node.rawName === 'Avatar' || node.name === 'Avatar' || node.name === 'avatar'

        if (!isAvatar) return

        const attributes = node.startTag?.attributes || []

        // --- 1. 子要素の検査 ---
        const childElements = node.children?.filter(child => child.type === 'VElement') || []

        if (childElements.length > 0) {
          context.report({
            node,
            messageId: 'noChildren',
          })
        }

        for (const attr of attributes) {
          const isDirective = Boolean(attr.directive)
          const propName = isDirective ? attr.key?.argument?.name : attr.key?.name
          const rawVal = attr.value?.value

          // --- 2. サイズの検査 ---
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

          // --- 3. クラスの検査 (rounded-* の禁止) ---
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

          // --- 4. text 属性の検査 (文章・句読点・エラーメッセージの禁止) ---
          if (propName === 'text' && !isDirective && typeof rawVal === 'string') {
            const trimmed = rawVal.trim()
            const hasPunctuation = /[。、！？!?]/.test(trimmed)
            const isSentence = trimmed.includes('してください') || trimmed.length > 15

            if (hasPunctuation || isSentence) {
              context.report({
                node: attr,
                messageId: 'noSentence',
                data: { text: trimmed.length > 12 ? `${trimmed.slice(0, 12)}...` : trimmed },
              })
            }
          }
        }
      },
    })
  },
}
