/**
 * no-unsupported-size-prop
 * [ESLint Custom Rule]
 * size プロパティを持たないコンポーネント（<Button>, <Input>, <Select>, <Badge>, <Heading>, <Panel> 等）
 * に対する無効な size / :size 属性の指定を検知・禁止するルール。
 * 文字サイズ連動（em単位）または Scoped CSS での文字サイズ指定を強制します。
 */

// size プロパティを明示的にサポートしているコンポーネントのホワイトリスト
const ALLOWED_SIZE_COMPONENTS = new Set([
  'Icon',
  'ResultTile',
  'ToolResultTile',
  'ToolResultVoltage',
  'ResultVoltage',
  'ToolResultConduit',
  'ResultConduit',
  'CircularGauge',
  'PortalCircularGauge',
])

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow unsupported size attribute on components without size prop',
    },
    messages: {
      unsupportedSizeProp: '<{{ name }}> に size プロパティは存在しません。サイズ変更は親要素やコンポーネントの文字サイズ（font-size）等で指定してください。',
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
        // Vue SFC では PascalCase で書かれたコンポーネントは rawName に 'Button'、name に 'button' が入る
        const componentName = node.rawName || node.name

        // HTML標準要素（小文字で書かれた通常タグ: button, input, div 等）は除外
        // 大文字で始まる Vue コンポーネントのみを対象とする
        if (!/^[A-Z]/.test(componentName)) {
          return
        }

        // size プロパティを持つことが明示的に定義・許可されているコンポーネントはスキップ
        if (ALLOWED_SIZE_COMPONENTS.has(componentName)) {
          return
        }

        const attributes = node.startTag?.attributes || []

        for (const attr of attributes) {
          const propName = attr.directive ? attr.key?.argument?.name : attr.key?.name

          if (propName === 'size') {
            context.report({
              node: attr,
              messageId: 'unsupportedSizeProp',
              data: { name: componentName },
            })
          }
        }
      },
    })
  },
}
