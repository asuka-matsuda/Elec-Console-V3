/**
 * strict-component-usage
 * [ESLint Custom Rule]
 * 共通コンポーネント（app/components/common）の利用規約を統合監視するルール。
 * （Props の型・必須チェックは TypeScript / vue-tsc に委譲し、テンプレート構造とクラス上書きのみを検査）
 *
 * 1. 廃止コンポーネント（<ClearableInput>, <CircularGauge>, <ProgressBar> 等）の使用禁止
 * 2. ネイティブ <input type="radio"> の直書き禁止（<Radio> コンポーネントを強制）
 * 3. サイズ拘束コンポーネント（Button, Input, Select, Toggle, Switch, Progress, Spinner）に対する
 *    消費者側からの高さ・パディング上書きクラス（h-*, p-*）の付与禁止
 */

const DEPRECATED_COMPONENTS = new Map([
  ['ClearableInput', '<Input clearable />'],
  ['clearable-input', '<Input clearable />'],
  ['CircularGauge', '<Gauge />'],
  ['circular-gauge', '<Gauge />'],
  ['PortalCircularGauge', '<Gauge />'],
  ['portal-circular-gauge', '<Gauge />'],
  ['ProgressBar', '<Progress />'],
  ['progress-bar', '<Progress />'],
])

const SIZE_LOCKED_COMPONENTS = new Set([
  'Button',
  'button',
  'AtomsButton',
  'Input',
  'AtomsInput',
  'Select',
  'AtomsSelect',
  'Toggle',
  'AtomsToggle',
  'Switch',
  'MoleculesSwitch',
  'Progress',
  'AtomsProgress',
  'Spinner',
  'AtomsSpinner',
])

const FORBIDDEN_SIZE_OVERRIDE_REGEX = /^(h|min-h|max-h|p|px|py|pt|pb|pl|pr)-/

function extractTokens(classStr) {
  if (!classStr || typeof classStr !== 'string') return []
  const tokens = []
  const regex = /(!?[\w\-:]+(\[.+?\])?)/g
  let m

  while ((m = regex.exec(classStr)) !== null) {
    const token = m[1]

    if (['true', 'false', 'null', 'undefined', 'return'].includes(token)) continue
    tokens.push(token)
  }

  return tokens
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce core usage rules for frozen common components without duplicating TypeScript prop checks',
    },
    messages: {
      deprecatedComponent: '廃止されたコンポーネント「<{{ name }}>」は使用禁止です。代わりに「{{ replacement }}」を使用してください。',
      forbiddenNativeRadio: 'ネイティブの <input type="radio"> の直書きは禁止されています。共通コンポーネント <Radio> を使用してください。',
      forbiddenSizingOverride: '<{{ component }}> のサイズ・余白は size プロパティで内部拘束されているため、利用側からの「{{ token }}」クラスの付与は禁止されています。',
    },
    schema: [],
  },
  create(context) {
    const filename = (context.filename || context.getFilename()).replace(/\\/g, '/')
    const isCommonComponent = filename.includes('/app/components/common/')

    const parserServices = context.sourceCode?.parserServices || context.parserServices

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {}
    }

    function checkClassTokens(rawStr, reportNode, componentName) {
      const tokens = extractTokens(rawStr)

      for (let token of tokens) {
        if (token.startsWith('!')) token = token.slice(1)
        const cleanToken = token.replace(/^(@?max-[\w-]+|@[\w-]+|xs|sm|md|lg|xl|2xl|hover|focus|focus-visible|active|disabled):/, '')

        if (FORBIDDEN_SIZE_OVERRIDE_REGEX.test(cleanToken)) {
          context.report({
            node: reportNode,
            messageId: 'forbiddenSizingOverride',
            data: {
              component: componentName,
              token,
            },
          })
        }
      }
    }

    return parserServices.defineTemplateBodyVisitor({
      VElement(node) {
        const rawName = node.rawName || node.name

        // 1. 廃止コンポーネントの検知
        if (DEPRECATED_COMPONENTS.has(rawName)) {
          context.report({
            node: node.startTag,
            messageId: 'deprecatedComponent',
            data: {
              name: rawName,
              replacement: DEPRECATED_COMPONENTS.get(rawName),
            },
          })

          return
        }

        // 2. ネイティブ <input type="radio"> の検知（共通コンポーネント内部は除外）
        if (!isCommonComponent && rawName === 'input') {
          const typeAttr = node.startTag.attributes.find(
            attr => !attr.directive && attr.key.name === 'type' && attr.value?.value === 'radio',
          )

          if (typeAttr) {
            context.report({
              node: typeAttr,
              messageId: 'forbiddenNativeRadio',
            })
          }

          return
        }

        // 3. サイズ拘束コンポーネントに対する高さ・余白クラス上書きの検知
        // ※ ネイティブの <button>, <input>, <select> と区別するため rawName が大文字始まりの場合のみ検査
        if (!isCommonComponent && /^[A-Z]/.test(rawName) && SIZE_LOCKED_COMPONENTS.has(rawName)) {
          for (const attr of node.startTag.attributes) {
            if (!attr.directive && attr.key.name === 'class' && attr.value) {
              checkClassTokens(attr.value.value, attr, rawName)
            }
            else if (
              attr.directive
              && attr.key.name?.name === 'bind'
              && attr.key.argument?.name === 'class'
              && attr.value?.expression
            ) {
              const expr = attr.value.expression

              if (expr.type === 'Literal' && typeof expr.value === 'string') {
                checkClassTokens(expr.value, expr, rawName)
              }
              else if (expr.type === 'ArrayExpression') {
                for (const el of expr.elements) {
                  if (el && el.type === 'Literal' && typeof el.value === 'string') {
                    checkClassTokens(el.value, el, rawName)
                  }
                }
              }
            }
          }
        }
      },
    })
  },
}
