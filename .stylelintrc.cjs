module.exports = {
  extends: [
    'stylelint-config-standard-scss',
    'stylelint-config-recommended-vue/scss',
    'stylelint-config-clean-order',
  ],
  rules: {
    // クラス名のパターン（BEMなどを許容するため）
    'selector-class-pattern': null,
    // !important の使用を禁止
    'declaration-no-important': true,
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
    // ①変数 ②構造Mixin ③プロパティ ④状態Mixin(interactive➔selected➔disabled) ⑤装飾Mixin ⑥ネスト の順序を強制する
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
        parameter: '^state-interactive',
      },
      {
        type: 'at-rule',
        name: 'include',
        parameter: '^state-control-interactive',
      },
      {
        type: 'at-rule',
        name: 'include',
        parameter: '^state-selected',
      },
      {
        type: 'at-rule',
        name: 'include',
        parameter: '^(border|cyber|hover|focus|active|blinking)',
      },
      {
        type: 'at-rule',
        name: 'include',
      },
      'rules',
      {
        type: 'at-rule',
        name: 'include',
        parameter: '^state-loading',
      },
      {
        type: 'at-rule',
        name: 'include',
        parameter: '^state-disabled',
      },
      'at-rules',
    ],
  },
  overrides: [
    {
      files: ['app/components/**/*.vue', 'app/pages/**/*.vue', 'app/layouts/**/*.vue'],
      rules: {
        // ハードコードされたシャドウの直接指定を禁止し、var(--shadow-*) トークンを強制
        'declaration-property-value-disallowed-list': {
          'box-shadow': [
            '/^[0-9]/',
            '/^#[0-9a-fA-F]/',
            '/^rgba?\\(/',
            '/^hsla?\\(/',
          ],
        },
        // 状態セレクタの手書きを禁止し、純粋な支援アクセシビリティセレクタ（aria-*, role）を禁止
        'selector-disallowed-list': [
          [
            '/^&(:disabled|\\.is-(interactive|selected|disabled))/',
            '/aria-/',
            '/role=/',
          ],
          {
            message: '純粋な支援アクセシビリティセレクタ（aria-*, role）および未許可の状態セレクタの手書きは禁止されています。',
          },
        ],
        // レイアウト・配置・z-index関連プロパティのScoped CSS記述を禁止（Tailwind記述を強制）
        'property-disallowed-list': [
          [
            'z-index',
            'justify-content',
            'align-items',
            'align-content',
            'align-self',
            'flex-direction',
            'flex-wrap',
            'flex-grow',
            'flex-shrink',
            'grid-template-columns',
            'grid-template-rows',
            'row-gap',
            'column-gap',
          ],
          {
            message: 'レイアウト・配置・z-index関連プロパティ（"%s"）はTailwindクラスで記述してください。Scoped CSSへの記述は規約により禁止されています。',
          },
        ],
      },
    },
  ],
}
