<script setup lang="ts">
/**
 * LayoutGlobalNav
 * アプリケーションのグローバルナビゲーション（サイドバーメニュー）を表示するコンポーネントです。
 */
import type { MenuSection } from "~/constants/data/menuData";

defineProps<{
  menuData: MenuSection[];
}>();

/** For mobile responsive toggle */
const isOpen = defineModel<boolean>("isOpen", { default: false });

/** Close sidebar on mobile when a link is clicked */
const closeSidebar = () => {
  isOpen.value = false;
};
</script>

<template>
  <div>
    <!-- Mobile Overlay -->
    <div
      class="l-global-nav-overlay"
      :class="{ 'is-open': isOpen }"
      @click="closeSidebar"
    />

    <!-- Global-Nav -->
    <aside class="l-global-nav" :class="{ 'is-open': isOpen }">
      <!-- Logo Header -->
      <header class="l-global-nav__header">
        <LayoutLogo @click="closeSidebar" />
      </header>
      <AppDivider type="fade-center" variant="sidebar-border" />

      <!-- Navigation Content -->
      <nav class="l-global-nav__nav custom-scrollbar">
        <section
          v-for="section in menuData"
          :key="section.id || section.heading || section.globalNavHeading"
          class="l-global-nav__section"
          :class="section.accent ? `has-accent-${section.accent}` : ''"
        >
          <header
            v-if="section.globalNavHeading || section.heading"
            class="l-global-nav__section-header"
          >
            <h3 class="l-global-nav__heading">
              {{ section.globalNavHeading || section.heading }}
            </h3>
            <AppDivider
              type="fade-side"
              :variant="section.accent || 'main'"
             
            />
          </header>

          <template v-for="item in section.items" :key="item.href">
            <NuxtLink
              v-if="!item.disabled"
              :to="item.href"
              class="l-global-nav__link"
              @click="closeSidebar"
            >
              <AppIcon :name="item.icon" class="l-global-nav__link-icon" />
              <span>{{ item.text }}</span>
            </NuxtLink>

            <div v-else class="l-global-nav__link is-disabled">
              <AppIcon :name="item.icon" class="l-global-nav__link-icon" />
              <span>{{ item.text }}</span>
            </div>
          </template>
        </section>
      </nav>
    </aside>
  </div>
</template>

<style scoped lang="scss">
.l-global-nav {
  // --- CSSカスタムプロパティ ---
  --sidebar-width: 280px;
  --sidebar-border: var(--color-border);

  // --- レイアウト・配置 ---
  position: fixed;
  z-index: var(--z-index-nav);

  @include flex-column;

  // --- ボックスモデル ---
  width: var(--sidebar-width);
  height: 100dvh;

  // --- 視覚効果 ---
  @include state-base(
    var(--shadow-elevation-md),
    transform var(--duration-slow) var(--ease-smooth)
  );

  // Mobile layout (hide by default)
  @include mq("md") {
    // --- 視覚効果 ---
    transform: translateX(-100%);

    // --- モディファイア ---
    &.is-open {
      // --- 視覚効果 ---
      transform: translateX(0);
    }
  }

  // --- 子要素 ---
  &__header {
    // --- レイアウト・配置 ---
    @include flex-start;

    flex-shrink: 0;

    // --- ボックスモデル ---
    height: 64px; // Match standard header height
    padding: var(--pad-container);

    // --- 視覚効果 ---
    box-shadow: var(--shadow-elevation-sm); // Replaced hardcoded shadow
  }

  &__nav {
    // --- CSSカスタムプロパティ ---
    --scrollbar-size: var(--size-2);

    // --- その他 ---
    overflow-y: auto;

    // --- レイアウト・配置 ---
    @include flex-column(var(--gap-section));

    flex: 1;

    /* ホバー時の右移動ではみ出さないよう、右側に余白を設ける */

    // --- ボックスモデル ---
    padding: var(--pad-container);
  }

  &__section {
    // Dynamic accent color support using Map and @each

    // --- SCSS変数・マップ ---
    $accents: (
      "primary": var(--color-category-main),
      "main": var(--color-category-main),
      "success": var(--color-status-success),
      "warning": var(--color-status-warning),
      "danger": var(--color-status-danger),
      "tool": var(--color-category-tool),
      "database": var(--color-category-database),
      "reference": var(--color-category-reference),
      "management": var(--color-category-management),
    );

    // --- レイアウト・配置 ---
    @include flex-column;

    @each $name, $var in $accents {
      // --- モディファイア ---
      &.has-accent-#{$name} {
        // --- CSSカスタムプロパティ ---
        --section-accent: #{$var};
      }
    }
  }

  &__section-header {
    // --- レイアウト・配置 ---
    @include flex-column(var(--gap-element));

    // --- ボックスモデル ---
    padding: var(--pad-section) var(--pad-component);
  }

  &__heading {
    // --- 継承 ---
    @extend %text-badge;
    color: var(--section-accent, var(--color-text-secondary));
  }

  &__link {
    // --- 継承 ---
    @extend %text-title-sm;

    // --- レイアウト・配置 ---
    @include flex-start(var(--gap-component));

    // --- ボックスモデル ---
    padding: var(--pad-component);

    // --- タイポグラフィ ---
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);

    // --- 視覚効果 ---
    @include state-base;

    &-text {
      // --- タイポグラフィ ---
      line-height: 1.4;
      word-break: keep-all; // 句読点やスペース、記号（・など）の区切りでのみ改行を許可
      line-break: strict;
      overflow-wrap: anywhere; // 万が一収まらない場合は強制改行
    }

    &-icon {
      // --- レイアウト・配置 ---
      flex-shrink: 0; // アイコンが潰れないように

      // --- ボックスモデル ---
      width: var(--icon-size-md);
      height: var(--icon-size-md);

      // --- 視覚効果 ---
      @include state-base;
    }

    // Hover

    // --- 疑似クラス ---
    &:hover:not(.is-disabled, .router-link-active) {
      // Replaced hardcoded shadow with cyber-text-glow or simplified shadow

      // --- CSSカスタムプロパティ ---
      --glow-color: theme-color(
        var(--section-accent, var(--color-category-main)),
        20%
      );

      // --- 視覚効果 ---
      transform: translateX(var(--space-1));

      // --- タイポグラフィ ---
      color: var(--section-accent, var(--color-category-main));

      // --- 視覚効果 ---
      @include state-hover;

      // --- 子要素 ---
      .l-global-nav__link-icon {
        // --- タイポグラフィ ---
        color: var(--section-accent, var(--color-category-main));

        // --- 視覚効果 ---
        filter: drop-shadow(
          0 0 var(--blur-sm)
            theme-color(var(--section-accent, var(--color-category-main)), 80%)
        );
      }
    }

    // Active
    &.router-link-active {
      // --- 視覚効果 ---
      transform: translateX(0);

      // --- タイポグラフィ ---
      color: var(--section-accent, var(--color-category-main));

      @include state-active(var(--section-accent, var(--color-category-main)));
      @include blinking-cursor(
        var(--space-1),
        var(--font-size-base),
        currentcolor
      );

      // --- 子要素 ---

      .l-global-nav__link-icon {
        // --- タイポグラフィ ---
        color: var(--section-accent, var(--color-category-main));

        // --- 視覚効果 ---
        filter: drop-shadow(
          0 0 var(--blur-sm) var(--section-accent, var(--color-category-main))
        );
      }
    }

    // Disabled

    // --- モディファイア ---
    &.is-disabled {
      // --- 継承 ---
      @extend %disabled;

      // --- 視覚効果 ---
      filter: grayscale(100%);
    }
  }
}

.l-global-nav-overlay {
  // --- レイアウト・配置 ---
  display: none; // Hidden on desktop

  @include mq("md") {
    // --- レイアウト・配置 ---
    position: fixed;
    z-index: var(--z-index-nav); // Just below sidebar
    top: 0;
    left: 0;

    display: block;

    // --- ボックスモデル ---
    width: 100vw;
    height: 100dvh;

    // --- その他 ---
    visibility: hidden;

    // --- 視覚効果 ---
    opacity: 0;
    backdrop-filter: blur(4px) brightness(0.4);

    transition:
      opacity var(--duration-slow) var(--ease-base),
      visibility var(--duration-slow) var(--ease-base);

    // --- モディファイア ---
    &.is-open {
      // --- その他 ---
      pointer-events: auto;
      visibility: visible;

      // --- 視覚効果 ---
      opacity: 1;
    }
  }
}
</style>
