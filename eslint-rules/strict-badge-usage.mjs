/**
 * strict-badge-usage
 * [ESLint Custom Rule]
 * Vercel Geist Badge ベストプラクティスに準拠した厳格な使用監視ルール
 * （※支援アクセシビリティ関連属性はプロジェクト規約により除外）
 *
 * 監視項目:
 * 1. 静的ラベルの強制（@click / インタラクティブ化の禁止）
 * 2. コンテンツ構成の制限（ネストバッジの禁止、複数アイコンスタックの禁止）
 * 3. 冗長なステータスアイコンの禁止（green/success時のチェックマーク、red/danger時のバツ印など）
 * 4. 文章・メッセージの混入禁止（句読点、主語述語構文、説明文の禁止）
 * 5. 英語表記の最適化（Title Case の強制、最大2単語、canonical term の遵守）
 * 6. ライフサイクルバッジ（Alpha, Beta 等）の Tooltip 同伴強制
 * 7. テンプレート置換タグ・コード表現の誤用防止
 */

const CANONICAL_TERM_MAP = {
  prod: 'Production',
  live: 'Deployed',
  cancelled: 'Canceled',
}

const LIFECYCLE_TERMS = new Set(['alpha', 'beta', 'early access', 'preview'])

const REDUNDANT_ICONS_BY_VARIANT = {
  success: new Set(['check', 'circle-check', 'check-circle', 'check-square']),
  green: new Set(['check', 'circle-check', 'check-circle', 'check-square']),
  danger: new Set(['x', 'circle-x', 'x-circle', 'circle-alert', 'alert-circle']),
  red: new Set(['x', 'circle-x', 'x-circle', 'circle-alert', 'alert-circle']),
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Vercel Geist Badge best practices strictly',
    },
    messages: {
      noInteractive: '<Badge> は静的ラベルです。クリックイベント（{{ event }}）を付与することは禁止されています。ユーザー操作が必要な場合は <Button> またはリンクを使用してください。',
      noNestedBadge: '<Badge> 内に子 <Badge> を入れ子にすることは禁止されています。',
      noMultipleIcons: '<Badge> 内に複数のアイコンを配置することは禁止されています。単一のテキストまたはアイコン+テキストのみ許可されます。',
      noRedundantStatusIcon: 'variant="{{ variant }}" にステータスアイコン（"{{ icon }}"）を付与することは禁止されています。バリアントの色自体が状態を表すため、不要なアイコンは削除してください。',
      noSentence: '<Badge> 内に文章やエラーメッセージを入れることは禁止されています（"{{ text }}"）。周囲の行や文脈を活用し、1〜2語の短い状態単語（例: Active, 進行中）にしてください。',
      enforceTitleCaseAndTerm: '英語のバッジラベルは Title Case で最大2単語にしてください（"{{ text }}" ──▶ 推奨: "{{ suggestion }}"）。',
      requireLifecycleTooltip: 'ライフサイクルバッジ（"{{ text }}"）には、仕様変更等の制約を明示する <Tooltip> を同伴させてください。',
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
        const isBadge = node.rawName === 'Badge' || node.name === 'Badge' || node.name === 'badge'

        if (!isBadge) return

        const attributes = node.startTag?.attributes || []

        // --- 1. 静的ラベルの強制（@click / v-on イベントの禁止） ---
        for (const attr of attributes) {
          if (attr.directive && (attr.key?.name?.name === 'on' || attr.key?.name === 'on')) {
            const eventName = attr.key?.argument?.name || 'click'

            context.report({
              node: attr,
              messageId: 'noInteractive',
              data: { event: `@${eventName}` },
            })
          }
        }

        // --- 2. プロパティの取得 ---
        let variantValue = ''
        let iconValue = ''

        for (const attr of attributes) {
          const propName = attr.directive ? attr.key?.argument?.name : attr.key?.name
          const rawVal = attr.value?.value

          if (propName === 'variant' && typeof rawVal === 'string') {
            variantValue = rawVal.trim()
          }

          if (propName === 'icon' && typeof rawVal === 'string') {
            iconValue = rawVal.trim()
          }
        }

        // --- 3. 子ノードの構造検査 ---
        const childElements = node.children?.filter(child => child.type === 'VElement') || []
        const childIcons = childElements.filter(el => el.rawName === 'Icon' || el.name === 'Icon' || el.name === 'icon')
        const childBadges = childElements.filter(el => el.rawName === 'Badge' || el.name === 'Badge' || el.name === 'badge')

        // ① ネストされた Badge の禁止
        for (const childBadge of childBadges) {
          context.report({
            node: childBadge,
            messageId: 'noNestedBadge',
          })
        }

        // ② アイコン多重スタックの禁止
        const totalIcons = (iconValue ? 1 : 0) + childIcons.length

        if (totalIcons > 1) {
          context.report({
            node,
            messageId: 'noMultipleIcons',
          })
        }

        // --- 4. 冗長なステータスアイコンの禁止 ---
        const redundantSet = REDUNDANT_ICONS_BY_VARIANT[variantValue]

        if (redundantSet) {
          if (iconValue && redundantSet.has(iconValue)) {
            context.report({
              node,
              messageId: 'noRedundantStatusIcon',
              data: { variant: variantValue, icon: iconValue },
            })
          }
          for (const iconEl of childIcons) {
            const nameAttr = iconEl.startTag?.attributes?.find(a => (a.directive ? a.key?.argument?.name : a.key?.name) === 'name')
            const nameVal = nameAttr?.value?.value

            if (nameVal && redundantSet.has(nameVal)) {
              context.report({
                node: iconEl,
                messageId: 'noRedundantStatusIcon',
                data: { variant: variantValue, icon: nameVal },
              })
            }
          }
        }

        // --- 5. スロット内テキストの検査 ---
        const textChildren = node.children?.filter(child => child.type === 'VText') || []

        for (const child of textChildren) {
          const rawText = child.value?.trim() || ''

          if (!rawText) continue

          // ① テンプレート置換記法（例: {現場名}, %キー名%）の検知 ──▶ <code> を推奨
          if (/^\{.*\}$/.test(rawText) || /^%.*%$/.test(rawText)) {
            context.report({
              node: child,
              messageId: 'noTemplateCode',
              data: { text: rawText },
            })
            continue
          }

          // ② 句読点（。、！？!?）や 16文字以上の長文・メッセージ構文の検知
          const hasPunctuation = /[。、！？!?]/.test(rawText)
          const isSentenceStructure = /\b(currently\s+active|you\s+are|please|error:)\b/i.test(rawText) || rawText.includes('してください') || rawText.includes('しました')

          if (hasPunctuation || isSentenceStructure || rawText.length > 20) {
            context.report({
              node: child,
              messageId: 'noSentence',
              data: { text: rawText.length > 15 ? `${rawText.slice(0, 15)}...` : rawText },
            })
            continue
          }

          // ③ 英語ラベルの Title Case & 単語数制限 & カノニカル用語の検査
          if (/^[A-Za-z0-9\s_-]+$/.test(rawText)) {
            const words = rawText.split(/\s+/).filter(Boolean)

            // 単語数が3単語以上
            if (words.length > 2) {
              context.report({
                node: child,
                messageId: 'enforceTitleCaseAndTerm',
                data: {
                  text: rawText,
                  suggestion: words.slice(0, 2).join(' '),
                },
              })
              continue
            }

            // カノニカル用語変換 (prod -> Production, live -> Deployed, cancelled -> Canceled)
            const lowerFull = rawText.toLowerCase()

            if (CANONICAL_TERM_MAP[lowerFull]) {
              context.report({
                node: child,
                messageId: 'enforceTitleCaseAndTerm',
                data: {
                  text: rawText,
                  suggestion: CANONICAL_TERM_MAP[lowerFull],
                },
              })
              continue
            }

            // Title Case チェック（全小文字は不可。例: 'active' -> 'Active'）
            const isAllLower = words.some(w => /^[a-z]+$/.test(w) && w.length > 1)

            if (isAllLower) {
              const suggested = words
                .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(' ')

              context.report({
                node: child,
                messageId: 'enforceTitleCaseAndTerm',
                data: {
                  text: rawText,
                  suggestion: suggested,
                },
              })
              continue
            }
          }

          // ④ ライフサイクルバッジの Tooltip 同伴チェック
          if (LIFECYCLE_TERMS.has(rawText.toLowerCase())) {
            let parent = node.parent
            let hasTooltip = false

            while (parent) {
              if (parent.type === 'VElement' && parent.name === 'Tooltip') {
                hasTooltip = true
                break
              }
              parent = parent.parent
            }

            if (!hasTooltip) {
              context.report({
                node: child,
                messageId: 'requireLifecycleTooltip',
                data: { text: rawText },
              })
            }
          }
        }
      },
    })
  },
}
