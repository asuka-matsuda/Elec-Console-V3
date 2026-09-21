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
          // SCSS内での固定余白（px/rem）の直接記述を禁止（文字連動emおよびCSS変数は許可）
          '/^padding(-inline|-block)?$/': [
            '/^[0-9.]+(px|rem)/',
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
        // および角丸（border-radius）の直接記述を原則全面禁止（真円以外撲滅・直角統一規約）
        'property-disallowed-list': [
          [
            'border-radius',
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
            message: 'プロパティ「%s」の記述は禁止されています。レイアウト系はTailwindを使用し、border-radiusは直角がデフォルトのため記述不要です（真円例外等は.stylelintrc.cjsのoverridesを参照）。',
          },
        ],
      },
    },
    {
      files: ['app/assets/scss/**/*.scss', 'error.vue'],
      rules: {
        // SCSSおよびerror.vue内でも border-radius の直接記述を禁止（真円以外撲滅・直角統一規約）
        'property-disallowed-list': [
          [
            'border-radius',
            '/^border-(top|bottom)-(left|right)-radius$/',
          ],
          {
            message: '「%s」の直接記述は禁止されています。直角はデフォルトで適用されます。',
          },
        ],
      },
    },
    // -------------------------------------------------------------------------
    // 【厳格規約】真円（50% / var(--radius-circle)）例外許可リスト
    // ※ AIアシスタントおよび開発者は、Lintエラー回避を目的としてこのリストへ勝手に
    //   ファイルを追加してはならない。必ず正方形（1:1）のアバターやインジケーター等の
    //   幾何学的真円要素に限り、設計者の明示的な承認を得た上で追加すること。
    // -------------------------------------------------------------------------
    {
      files: [
        'app/components/common/organisms/Header.vue',
        'app/components/portal/molecules/SyncStatusBadge.vue',
        'app/components/portal/organisms/CalTypeSettingsModal.vue',
      ],
      rules: {
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
        ],
        'declaration-property-value-allowed-list': {
          'border-radius': ['50%', 'var(--radius-circle)'],
        },
      },
    },
    // -------------------------------------------------------------------------
    // 【厳格規約】外部ライブラリ等の角丸リセット（0）例外許可リスト
    // ※ 外部パッケージ組み込みの角丸を強制リセットする場合のみ登録。
    // -------------------------------------------------------------------------
    {
      files: [
        'app/components/portal/organisms/Cal.client.vue',
        'app/assets/scss/foundation/_reset.scss',
      ],
      rules: {
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
        ],
        'declaration-property-value-allowed-list': {
          'border-radius': ['0'],
        },
      },
    },
  ],
}
