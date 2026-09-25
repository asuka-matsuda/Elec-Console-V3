/**
 * no-raw-html-elements
 * [ESLint Custom Rule]
 * Vue SFC の <template> 内での生HTMLフォーム・テーブル・ボタン要素の記述を禁止するルール。
 * プロジェクト共通コンポーネント（Atoms / Molecules）の利用を強制し、
 * 生タグによる車輪の再発明やデザインシステムの逸脱を防止します。
 */

const FORBIDDEN_ELEMENTS = {
  input: { component: 'Input / Checkbox / RadioGroup', hint: 'app/components/common/atoms/Input.vue 等' },
  select: { component: 'Select', hint: 'app/components/common/atoms/Select.vue' },
  textarea: { component: 'Textarea', hint: 'app/components/common/atoms/Textarea.vue' },
  table: { component: 'Table', hint: 'app/components/common/molecules/Table.vue' },
  button: { component: 'Button', hint: 'app/components/common/atoms/Button.vue' },
}

// 例外的に生タグの使用が許可されるファイル
const WHITELIST = [
  // 共通コンポーネント自身
  { pattern: /app\/components\/common\/atoms\/Input\.vue$/, elements: ['input'] },
  { pattern: /app\/components\/common\/atoms\/Checkbox\.vue$/, elements: ['input'] },
  { pattern: /app\/components\/common\/atoms\/RadioGroup\.vue$/, elements: ['input'] },
  { pattern: /app\/components\/common\/atoms\/Textarea\.vue$/, elements: ['textarea'] },
  { pattern: /app\/components\/common\/atoms\/Button\.vue$/, elements: ['button'] },
  { pattern: /app\/components\/common\/atoms\/Select\.vue$/, elements: ['button'] },
  { pattern: /app\/components\/common\/molecules\/Table\.vue$/, elements: ['table'] },
  { pattern: /app\/components\/common\/molecules\/Tabs\.vue$/, elements: ['button'] },
  { pattern: /app\/components\/common\/molecules\/HelpTip\.vue$/, elements: ['button'] },

  // 特殊な低レベルUIコンポーネント
  { pattern: /app\/components\/portal\/admin\/ExcelDropzone\.vue$/, elements: ['input', 'button'] },
  { pattern: /app\/components\/portal\/exam\/ExamMinimap\.vue$/, elements: ['button'] },
  { pattern: /app\/components\/portal\/souden\/SyncStatusBadge\.vue$/, elements: ['button'] },
  { pattern: /app\/components\/reference\/KanaFilter\.vue$/, elements: ['button'] },
  { pattern: /app\/components\/tool\/ResultDrawer\.vue$/, elements: ['button'] },
  { pattern: /app\/components\/portal\/calendar\/ModalCalendarTypeSettings\.vue$/, elements: ['button'] },
]

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow raw HTML form, table, and button elements in Vue templates',
    },
    messages: {
      forbidden: '生HTML要素 <{{ element }}> の使用は禁止されています。プロジェクト共通の <{{ component }}> を使用してください。（{{ hint }}）',
    },
    schema: [],
  },
  create(context) {
    const filename = (context.filename || context.physicalFilename || '').replace(/\\/g, '/')

    if (!filename.endsWith('.vue')) {
      return {}
    }

    // ホワイトリストに合致するか判定
    const isWhitelisted = (elementName) => {
      return WHITELIST.some(rule => rule.pattern.test(filename) && rule.elements.includes(elementName))
    }

    const parserServices = context.sourceCode?.parserServices || context.parserServices

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {}
    }

    return parserServices.defineTemplateBodyVisitor({
      VElement(node) {
        const rawName = node.rawName || node.name

        if (!rawName) return

        // PascalCase / 大文字から始まるタグはコンポーネントなので対象外
        if (/^[A-Z]/.test(rawName)) return

        const elementName = rawName.toLowerCase()

        if (FORBIDDEN_ELEMENTS[elementName]) {
          if (isWhitelisted(elementName)) {
            return
          }

          const { component, hint } = FORBIDDEN_ELEMENTS[elementName]

          context.report({
            node,
            loc: node.loc,
            messageId: 'forbidden',
            data: {
              element: rawName,
              component,
              hint,
            },
          })
        }
      },
    })
  },
}
