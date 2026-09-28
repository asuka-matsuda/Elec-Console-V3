/**
 * strict-badge-usage
 * [ESLint Custom Rule]
 * <Badge> の誤用（長文文章、エラーメッセージ、プレースホルダー、バージョン番号、廃止属性）
 * を防止し、状態（ステータス）を色で示す本来の目的に限定するルール。
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce strict and proper usage of <Badge> component',
    },
    messages: {
      deprecatedProp: '<Badge> の「{{ name }}」プロパティは廃止されました。直接 :color を指定するか、未指定（デフォルト）にしてください。',
      noSentence: '<Badge> 内に文章やエラーメッセージを入れることは禁止されています（"{{ text }}"）。Badge は「OK」「進行中」等の短い単語専用です。メッセージは Alert または FormGroup のエラーテキストを使用してください。',
      noVersion: 'バージョン番号を <Badge> で囲むことは禁止されています。プレーンなテキスト（<small class="text-muted font-mono">）を使用してください。',
      noTemplateCode: 'テンプレート置換タグ（"{{ text }}"）に <Badge> を使用することは禁止されています。<code> タグを使用してください。',
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
        if (node.name !== 'Badge') return

        // 1. 廃止されたプロパティ (id, variant) の検知
        const attributes = node.startTag?.attributes || []

        for (const attr of attributes) {
          const propName = attr.directive ? attr.key?.argument?.name : attr.key?.name

          if (propName === 'id' || propName === 'variant') {
            context.report({
              node: attr,
              messageId: 'deprecatedProp',
              data: { name: propName },
            })
          }
        }

        // 2. スロット内のテキストノードを検査
        const textChildren = node.children?.filter(child => child.type === 'VText') || []

        for (const child of textChildren) {
          const rawText = child.value?.trim() || ''

          if (!rawText) continue

          // ① プレースホルダー記法（例: {現場名}）の検知 ──▶ <code> を推奨
          if (/^\{.*\}$/.test(rawText)) {
            context.report({
              node: child,
              messageId: 'noTemplateCode',
              data: { text: rawText },
            })
          }

          // ② 句読点（。、！？）や 10文字以上の長文・メッセージの検知 ──▶ Alert/テキストを推奨
          if (/[。、！？]/.test(rawText) || rawText.length > 10 || rawText.includes('失敗') || rawText.includes('してください')) {
            context.report({
              node: child,
              messageId: 'noSentence',
              data: { text: rawText.length > 12 ? `${rawText.slice(0, 12)}...` : rawText },
            })
          }
        }

        // 3. 式ノード（{{ item.version }} 等）のバインディング検査
        const expressions = node.children?.filter(child => child.type === 'VExpressionContainer') || []

        for (const exp of expressions) {
          const rawCode = context.sourceCode.getText(exp)

          // version という名前の変数をバッジで囲んでいたら検知
          if (/\b(version|item\.version|row\.version)\b/.test(rawCode)) {
            context.report({
              node: exp,
              messageId: 'noVersion',
            })
          }
        }
      },
    })
  },
}
