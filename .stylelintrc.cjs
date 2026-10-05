module.exports = {
  extends: [
    'stylelint-config-standard-scss',
    'stylelint-config-recommended-vue/scss',
    'stylelint-config-clean-order',
  ],
  rules: {
    // クラス名のパターン（BEMなどを許容するため）
    'selector-class-pattern': null,
    // コンテナクエリは Tailwind の @container に一本化するため SCSS での直接使用を禁止
    'at-rule-disallowed-list': ['container'],
    // !important の使用を禁止
    'declaration-no-important': true,
    // Vueの:deep()など疑似クラスのパースエラー回避
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['deep', 'global', 'slotted'],
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
        parameter: '^(control-glow|flex|grid|inline-flex|text|font|click-enabled|reset)',
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
        parameter: '^state-active',
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
          // SCSS内での固定余白（px/rem）の直接記述を禁止（文字連動emおよびCSS変数は許可）
          '/^padding(-inline|-block)?$/': [
            '/^[0-9.]+(px|rem)/',
          ],
        },
        // 状態セレクタの手書きを禁止し、純粋な支援アクセシビリティセレクタ（aria-*, role）、:deep、および装飾ユーティリティクラスを禁止
        'selector-disallowed-list': [
          [
            '/is-hover/',
            '/&\\.(active|selected|open)\\b/',
            '/&\\.is-(selected|current)\\b/',
            '/aria-/',
            '/role=/',
            '/:deep\\(/',
            '/::v-deep/',
            '/\\btext-(primary|secondary|accent|success|warning|danger|muted)\\b/',
          ],
          {
            message: ':deep によるコンポーネントスタイルの打ち消し、支援アクセシビリティセレクタ（aria-*, role）、装飾用ユーティリティクラス（text-* 等）は禁止されています。装飾や色は Scoped CSS / CSS 変数で直接定義してください。',
          },
        ],
        // レイアウト・配置・z-index関連プロパティのScoped CSS記述を禁止（Tailwind記述を強制）
        // および個別角丸プロパティの記述を禁止
        'property-disallowed-list': [
          [
            '/^border-(top|bottom)-(left|right)-radius$/',
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
            message: 'プロパティ「%s」の記述は禁止されています。レイアウト系はTailwindを使用してください。',
          },
        ],
        // 【厳格規約】border-radius は幾何学的真円（50% / var(--radius-circle)）またはリセット（0）のみ許可
        // ※ 4px, 8px等のpx/remハードコードおよび50%以外の中途半端な角丸変数は一切不許可
        'declaration-property-value-allowed-list': {
          'border-radius': ['50%', 'var(--radius-circle)', '0'],
        },
      },
    },
    {
      files: ['app/assets/scss/**/*.scss', 'error.vue'],
      rules: {
        'property-disallowed-list': [
          [
            '/^border-(top|bottom)-(left|right)-radius$/',
          ],
          {
            message: '「%s」の直接記述は禁止されています。',
          },
        ],
        'declaration-property-value-allowed-list': {
          'border-radius': ['50%', 'var(--radius-circle)', '0'],
        },
      },
    },
    // -------------------------------------------------------------------------
    // 【厳格規約】外部ライブラリ等の :deep 例外許可リスト
    // ※ 外部パッケージ（FullCalendar, KaTeX）の描画要素や、スロット要素の装飾のみ登録。
    // -------------------------------------------------------------------------
    {
      files: [
        'app/components/portal/calendar/Calendar.client.vue',
        'app/components/tool/MathBasis.vue',
        'app/components/tool/MathLegend.vue',
        'app/components/tool/ResultTile.vue',
        'app/components/portal/exam/TableSoudenCircuit.vue',
      ],
      rules: {
        'selector-disallowed-list': [
          [
            '/is-hover/',
            '/&\\.(active|selected|open)\\b/',
            '/&\\.is-(selected|current)\\b/',
            '/aria-/',
            '/role=/',
          ],
        ],
      },
    },
  ],
}
