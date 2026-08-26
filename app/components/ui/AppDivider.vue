<script setup lang="ts">
/**
 * AppDivider
 * 画面やコンテンツの区切り線を表示するコンポーネント
 */
withDefaults(
  defineProps<{
    variant?:
      | "main"
      | "tool"
      | "database"
      | "reference"
      | "management"
      | "danger"
      | "success"
      | "border"
      | "sidebar-border";
    type?: "solid" | "fade-center" | "fade-side";
    vertical?: boolean;
  }>(),
  {
    variant: "main",
    type: "solid",
    vertical: false,
  },
);
</script>

<template>
  <div
    class="c-divider"
    :class="[
      `has-accent-${variant}`,
      `is-type-${type}`,
      {
        'c-divider--vertical': vertical,
        'c-divider--horizontal': !vertical,
      },
    ]"
  />
</template>

<style scoped lang="scss">
.c-divider {
  // --- SCSS変数・マップ ---
  $accents: (
    "main": var(--color-category-main),
    "tool": var(--color-category-tool),
    "database": var(--color-category-database),
    "reference": var(--color-category-reference),
    "management": var(--color-category-management),
    "danger": var(--color-status-danger),
    "success": var(--color-status-success),
    "border": var(--color-border),
    "sidebar-border": var(--sidebar-border),
  );

  // Default (Horizontal)

  // --- CSSカスタムプロパティ ---
  --divider-size-x: 100%;
  --divider-size-y: var(--border-width-base);
  --divider-min-h: auto;
  --pulse-w: 30%;
  --pulse-h: 100%;
  --pulse-top: 0;
  --pulse-left: -30%;
  --grad-dir-fade: to right;
  --grad-dir-pulse: 90deg;

  // --- レイアウト・配置 ---
  position: relative;
  transform-origin: center;

  // --- その他 ---
  overflow: hidden; // アニメーションの光がはみ出さないようにする

  // --- レイアウト・配置 ---
  flex-shrink: 0;

  // --- ボックスモデル ---
  width: var(--divider-size-x);
  height: var(--divider-size-y);
  min-height: var(--divider-min-h);

  // --- 視覚効果 ---
  box-shadow: var(--shadow-sink); // 彫り込まれた溝の影

  animation: divider-scale-x 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;

  // --- モディファイア ---
  &--horizontal {
    width: 100%;
    height: 1px;
  }

  &--vertical {
    // --- CSSカスタムプロパティ ---
    --divider-size-x: var(--border-width-base);
    --divider-size-y: auto;
    --divider-min-h: 100%;
    --pulse-w: 100%;
    --pulse-h: 30%;
    --pulse-top: -30%;
    --pulse-left: 0;
    --grad-dir-fade: to bottom;
    --grad-dir-pulse: 180deg;
  }

  &.is-type-solid {
    // --- 視覚効果 ---
    background: var(--color-border);

    // パルス発光用のData Flow（擬似要素）

    // --- 疑似要素 ---
    &::before {
      content: "";

      // --- レイアウト・配置 ---
      position: absolute;
      top: var(--pulse-top);
      left: var(--pulse-left);

      // --- ボックスモデル ---
      width: var(--pulse-w);
      height: var(--pulse-h);

      // --- 視覚効果 ---
      background: linear-gradient(
        var(--grad-dir-pulse),
        transparent,
        theme-color(var(--glow-color, var(--color-category-main)), 80%),
        transparent
      );
      box-shadow: var(--shadow-glow-md);

      animation: data-pulse-x 3s ease-in-out infinite;
    }
  }

  &.is-type-fade-center {
    // --- 視覚効果 ---
    background: linear-gradient(
      var(--grad-dir-fade),
      transparent 0%,
      var(--glow-color) 50%,
      transparent 100%
    );
  }

  &.is-type-fade-side {
    // --- 視覚効果 ---
    background: linear-gradient(
      var(--grad-dir-fade),
      var(--glow-color) 0%,
      transparent 100%
    );
  }

  @each $name, $val in $accents {
    // --- モディファイア ---
    &.has-accent-#{$name} {
      // --- CSSカスタムプロパティ ---
      --glow-color: #{$val};
    }
  }

  // --- キーフレーム ---
  @keyframes divider-scale-x {
    // --- 子要素 ---
    from {
      // --- 視覚効果 ---
      transform: scaleX(0);
      opacity: 0;
    }

    to {
      // --- 視覚効果 ---
      transform: scaleX(1);
      opacity: 1;
    }
  }

  @keyframes divider-scale-y {
    // --- 子要素 ---
    from {
      // --- 視覚効果 ---
      transform: scaleY(0);
      opacity: 0;
    }

    to {
      // --- 視覚効果 ---
      transform: scaleY(1);
      opacity: 1;
    }
  }

  @keyframes data-pulse-x {
    0% {
      // --- 視覚効果 ---
      transform: translateX(0);
      opacity: 0;
    }

    10% {
      // --- 視覚効果 ---
      opacity: 1;
    }

    50% {
      // --- 視覚効果 ---
      opacity: 1;
    }

    60% {
      // --- 視覚効果 ---
      transform: translateX(450%);
      opacity: 0;
    } // 100% + 300% travel + buffer
    100% {
      // --- 視覚効果 ---
      transform: translateX(450%);
      opacity: 0;
    }
  }

  @keyframes data-pulse-y {
    0% {
      // --- 視覚効果 ---
      transform: translateY(0);
      opacity: 0;
    }

    10% {
      // --- 視覚効果 ---
      opacity: 1;
    }

    50% {
      // --- 視覚効果 ---
      opacity: 1;
    }

    60% {
      // --- 視覚効果 ---
      transform: translateY(450%);
      opacity: 0;
    } // 100% + 300% travel + buffer
    100% {
      // --- 視覚効果 ---
      transform: translateY(450%);
      opacity: 0;
    }
  }
}
</style>
