<script setup lang="ts">
/**
 * AppGlobalNav
 * アプリケーションのグローバルナビゲーション（サイドバーメニュー）を表示するコンポーネントです。
 */
import type { MenuSection } from "~/utils/data/menuData";

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
        <AppLogo @click="closeSidebar" />
      </header>

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
              class="l-global-nav__divider"
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
              <span class="l-global-nav__link-text">{{ item.text }}</span>
            </NuxtLink>

            <div v-else class="l-global-nav__link is-disabled">
              <AppIcon :name="item.icon" class="l-global-nav__link-icon" />
              <span class="l-global-nav__link-text">{{ item.text }}</span>
            </div>
          </template>
        </section>
      </nav>
    </aside>
  </div>
</template>

<style scoped lang="scss">
.l-global-nav {
  // --- Theme Variables ---
  --sidebar-width: 280px;
  --sidebar-border: var(--color-border);

  // --- Base Styles ---
  position: fixed;
  z-index: var(--z-index-nav);

  display: flex;
  flex-direction: column;

  width: var(--sidebar-width);
  height: 100dvh;

  @include elevation('md', 'base', false); // Replaced hardcoded shadow

  transition: transform var(--duration-slow) var(--ease-float);

  @include border-fade(right, var(--sidebar-border));

  // Mobile layout (hide by default)
  @include mq("md") {
    transform: translateX(-100%);

    &.is-open {
      transform: translateX(0);
    }
  }

  // --- Logo Header ---
  &__header {
    @include flex-start;

    flex-shrink: 0;
    height: 64px; // Match standard header height
    padding: var(--pad-container);

    @include elevation('sm', 'base', false); // Replaced hardcoded shadow

    @include border-fade(bottom, var(--sidebar-border));
  }

  // --- Navigation Content ---
  &__nav {

    --scrollbar-size: var(--size-2);

    overflow-y: auto;
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--gap-section); // セクション間の隙間なので gap-section が適切

    /* ホバー時の右移動ではみ出さないよう、右側に余白を設ける */
    padding: var(--pad-container);
  }

  &__section {
    // Dynamic accent color support using Map and @each
    $accents: (
      "primary": var(--color-category-main),
      "main": var(--color-category-main),
      "success": var(--color-status-success),
      "warning": var(--color-status-warning),
      "danger": var(--color-status-danger),
      "tool": var(--color-category-tool),
      "database": var(--color-category-database),
      "reference": var(--color-category-reference),
      "management": var(--color-category-management)
    );

    display: flex;
    flex-direction: column;
    gap: var(--gap-component);

    @each $name, $var in $accents {
      &.has-accent-#{$name} {
        --section-accent: #{$var};
      }
    }
  }

  &__section-header {
    @include border-fade(bottom, var(--sidebar-border), 'side');

    display: flex;
    flex-direction: column;
    gap: var(--gap-element);
    padding: var(--space-3) var(--space-2);
  }

  &__heading {
    @extend %text-xs;

    font-weight: var(--font-weight-bold);
    color: var(--section-accent, var(--color-text-secondary));
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  // --- Navigation Links ---
  &__link {

    @extend %text-sm;

    @include flex-start(var(--gap-component));

    padding: var(--space-2);

    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
    text-decoration: none;

    transition: var(--transition-base);

    &-text {
      line-height: 1.4;
      word-break: keep-all; // 句読点やスペース、記号（・など）の区切りでのみ改行を許可
      line-break: strict;
      overflow-wrap: anywhere; // 万が一収まらない場合は強制改行
    }

    &-icon {
      flex-shrink: 0; // アイコンが潰れないように
      width: var(--icon-size-md);
      height: var(--icon-size-md);
      transition: var(--transition-base);
    }

    // Hover
    &:hover:not(.is-disabled, .router-link-active) {
      transform: translateX(var(--space-1));
      color: var(--section-accent, var(--color-category-main));

      // Replaced hardcoded shadow with cyber-text-glow or simplified shadow
      box-shadow: 0 0 var(--blur-sm)
        theme-color(var(--section-accent, var(--color-category-main)), 20%);

      .l-global-nav__link-icon {
        color: var(--section-accent, var(--color-category-main));
        filter: drop-shadow(
          0 0 var(--blur-sm)
            theme-color(var(--section-accent, var(--color-category-main)), 80%)
        );
      }
    }

    // Active
    &.router-link-active {
      transform: translateX(0);
      border-color: transparent;
      color: var(--section-accent, var(--color-category-main));

      @include active(var(--section-accent, var(--color-category-main)));
      @include blinking-cursor(
        var(--space-1),
        var(--font-size-base),
        currentcolor
      );

      .l-global-nav__link-text {
        font-weight: var(--font-weight-bold);
      }

      .l-global-nav__link-icon {
        color: var(--section-accent, var(--color-category-main));
        filter: drop-shadow(
          0 0 var(--blur-sm) var(--section-accent, var(--color-category-main))
        );
      }
    }

    // Disabled
    &.is-disabled {
      @extend %disabled;

      filter: grayscale(100%);
    }
  }
}

// --- Mobile Overlay ---
.l-global-nav-overlay {
  display: none; // Hidden on desktop

  @include mq("md") {
    position: fixed;
    z-index: var(--z-index-nav); // Just below sidebar
    top: 0;
    left: 0;

    display: block;

    width: 100vw;
    height: 100dvh;

    visibility: hidden;
    opacity: 0;
    backdrop-filter: blur(4px) brightness(0.4);

    transition:
      opacity var(--duration-slow) var(--ease-out),
      visibility var(--duration-slow) var(--ease-out);

    &.is-open {
      pointer-events: auto;
      visibility: visible;
      opacity: 1;
    }
  }
}
</style>
