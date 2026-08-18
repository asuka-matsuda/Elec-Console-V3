<script setup lang="ts">
import type { MenuSection } from "../utils/menuData";

defineProps<{
  menuData: MenuSection[];
}>();

// For mobile responsive toggle
const isOpen = defineModel<boolean>("isOpen", { default: false });

// Close sidebar on mobile when a link is clicked
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
  --sidebar-width: 280px;
  --sidebar-border: var(--color-border);

  position: fixed;
  display: flex;
  flex-direction: column;
  width: var(--sidebar-width);
  height: 100dvh;
  z-index: var(--z-index-nav);

  @include ui-border-fade(right, var(--sidebar-border));

  box-shadow: var(--shadow-elevation-hover); // Replaced hardcoded shadow
  transition: transform var(--duration-slow) var(--ease-float);

  // Mobile layout (hide by default)
  @include mq("md") {
    transform: translateX(-100%);

    &.is-open {
      transform: translateX(0);
    }
  }

  // --- Logo Header ---
  &__header {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    height: 64px; // Match standard header height
    padding: var(--space-4);

    @include ui-border-fade(bottom, var(--sidebar-border));

    box-shadow: var(--shadow-elevation-base); // Replaced hardcoded shadow
  }

  // --- Navigation Content ---
  &__nav {
    flex: 1;
    overflow-y: auto;

    /* ホバー時の右移動ではみ出さないよう、右側に余白を設ける */
    padding: var(--pad-container);
    display: flex;
    flex-direction: column;
    gap: var(--gap-section); // セクション間の隙間なので gap-section が適切

    @include custom-scrollbar;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: var(--gap-component);

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

    @each $name, $var in $accents {
      &.has-accent-#{$name} {
        --section-accent: #{$var};
      }
    }
  }

  &__section-header {
    display: flex;
    flex-direction: column;
    gap: var(--gap-element);
    padding: var(--space-3) var(--space-2);
  }

  &__heading {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    color: var(--section-accent, var(--color-text-secondary));
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  // --- Navigation Links ---
  &__link {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-2);
    text-decoration: none;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    transition: var(--transition-base);

    &-text {
      word-break: keep-all; // 句読点やスペース、記号（・など）の区切りでのみ改行を許可
      overflow-wrap: anywhere; // 万が一収まらない場合は強制改行
      line-break: strict;
      line-height: 1.4;
    }

    &-icon {
      width: var(--icon-size-md);
      height: var(--icon-size-md);
      flex-shrink: 0; // アイコンが潰れないように
      transition: var(--transition-base);
    }

    // Hover
    &:hover:not(.is-disabled, .router-link-active) {
      color: var(--section-accent, var(--color-category-main));

      // Replaced hardcoded shadow with cyber-text-glow or simplified shadow
      box-shadow: 0 0 var(--blur-sm)
        theme-color(var(--section-accent, var(--color-category-main)), 20%);
      transform: translateX(var(--space-1));

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
      color: var(--section-accent, var(--color-category-main));
      border-color: transparent;
      transform: translateX(0);

      @include ui-active(var(--section-accent, var(--color-category-main)));
      @include ui-blinking-cursor(
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
      opacity: 0.4;
      cursor: not-allowed;
      filter: grayscale(100%);
    }
  }
}

// --- Mobile Overlay ---
.l-global-nav-overlay {
  display: none; // Hidden on desktop

  @include mq("md") {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 90; // Just below sidebar (100)
    width: 100vw;
    height: 100dvh;
    backdrop-filter: blur(4px) brightness(0.4);
    opacity: 0;
    visibility: hidden;
    transition:
      opacity var(--duration-slow) var(--ease-out),
      visibility var(--duration-slow) var(--ease-out);

    &.is-open {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }
  }
}
</style>
