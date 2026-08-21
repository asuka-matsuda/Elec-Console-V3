module.exports = {
  extends: [
    "stylelint-config-standard-scss",
    "stylelint-config-recommended-vue/scss",
    "stylelint-config-recess-order"
  ],
  rules: {
    // クラス名のパターン（BEMなどを許容するため）
    "selector-class-pattern": null,
    // Vueの:deep()など疑似クラスのパースエラー回避
    "selector-pseudo-class-no-unknown": [
      true,
      {
        ignorePseudoClasses: ["deep", "global"]
      }
    ],
    // CSS変数の空行などの制限を緩める
    "custom-property-empty-line-before": null,
    // SCSS特有の@規則（@include, @useなど）のエラー回避
    "scss/at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: ["tailwind", "apply", "variants", "responsive", "screen", "layer"]
      }
    ],
    // -webkit- などのベンダープレフィックスを許容
    "property-no-vendor-prefix": null,
    "value-no-vendor-prefix": null,
    // Nuxtの #__nuxt などを許容
    "selector-id-pattern": null,
    // 一時的に空のブロックを許容
    "block-no-empty": null,
    // SCSSの演算子の後の改行を許容
    "scss/operator-no-newline-after": null
  }
};
