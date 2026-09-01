module.exports = {
  extends: [
    'stylelint-config-standard-scss',
    'stylelint-config-recommended-vue/scss',
    'stylelint-config-clean-order',
  ],
  rules: {
    // クラス名のパターン（BEMなどを許容するため）
    'selector-class-pattern': null,
    // Vueの:deep()など疑似クラスのパースエラー回避
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['deep', 'global'],
      },
    ],
    // CSS変数の空行などの制限を緩める
    'custom-property-empty-line-before': null,
    // SCSS特有の@規則（@include, @useなど）のエラー回避
    'scss/at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['tailwind', 'apply', 'variants', 'responsive', 'screen', 'layer'],
      },
    ],
    // -webkit- などのベンダープレフィックスを許容
    'property-no-vendor-prefix': null,
    'value-no-vendor-prefix': null,
    // Nuxtの #__nuxt などを許容
    'selector-id-pattern': null,
    // 一時的に空のブロックを許容
    'block-no-empty': null,
    // SCSSの演算子の後の改行を許容
    'scss/operator-no-newline-after': null,
    // @else の前に空行を強制挿入しないようにする（Sassの構文エラー回避）
    'scss/at-else-empty-line-before': 'never',
    'at-rule-empty-line-before': [
      'always',
      {
        except: ['blockless-after-same-name-blockless', 'first-nested'],
        ignore: ['after-comment'],
        ignoreAtRules: ['else'],
      },
    ],
    // ①変数 ②構造Mixin ③プロパティ ④装飾Mixin ⑤ネスト の順序を強制する
    'order/order': [
      'dollar-variables',
      'custom-properties',
      {
        type: 'at-rule',
        name: 'include',
        parameter: '^(flex|grid|inline-flex|text|font|click-enabled|reset)',
      },
      'declarations',
      {
        type: 'at-rule',
        name: 'include',
        parameter: '^(border|state|cyber|disabled|hover|focus|active|blinking)',
      },
      {
        type: 'at-rule',
        name: 'include',
      },
      'rules',
      'at-rules',
    ],
  },
}
