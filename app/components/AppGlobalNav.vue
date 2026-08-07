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

    <!-- Sidebar -->
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
  --sidebar-border: var(--color-border-base);

  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  width: var(--sidebar-width);
  height: 100dvh;
  z-index: var(--z-index-nav);
  border-right: var(--border-width-base) solid var(--sidebar-border);
  box-shadow: var(--shadow-elevation-hover); // Replaced hardcoded shadow
  transition: transform var(--duration-normal) var(--ease-out-back);

  // Mobile layout (hide by default)
  @include mq("lg") {
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
    height: 72px; // Match standard header height
    padding: 0 var(--space-4);
    border-bottom: var(--border-width-base) solid var(--sidebar-border);
    box-shadow: var(--shadow-elevation-base); // Replaced hardcoded shadow
  }

  // --- Navigation Content ---
  &__nav {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    @include custom-scrollbar();
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);

    // Dynamic accent color support
    &.has-accent-primary,
    &.has-accent-main {
      --section-accent: var(--color-category-main);
    }
    &.has-accent-success {
      --section-accent: var(--color-status-success);
    }
    &.has-accent-warning {
      --section-accent: var(--color-status-warning);
    }
    &.has-accent-danger {
      --section-accent: var(--color-status-danger);
    }

    // Category Accents
    &.has-accent-tool {
      --section-accent: var(--color-category-tool);
    }
    &.has-accent-database {
      --section-accent: var(--color-category-database);
    }
    &.has-accent-reference {
      --section-accent: var(--color-category-reference);
    }
    &.has-accent-management {
      --section-accent: var(--color-category-management);
    }
  }

  &__section-header {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin-bottom: var(--space-2);
  }

  &__heading {
    font-size: var(--text-xs);
    font-weight: var(--font-weight-bold);
    color: var(--section-accent, var(--color-text-secondary));
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding-left: var(--space-2);
  }

  &__divider {
    margin: 0;
  }

  // --- Navigation Links ---
  &__link {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    text-decoration: none;
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    border-radius: 0;
    transition: var(--transition-base);

    &-text {
      word-break: keep-all; // 句読点やスペース、記号（・など）の区切りでのみ改行を許可
      overflow-wrap: anywhere; // 万が一収まらない場合は強制改行
      line-break: strict;
      line-height: 1.4;
    }

    &-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0; // アイコンが潰れないように
      transition: var(--transition-base);
    }

    // Hover
    &:hover:not(.is-disabled):not(.router-link-active) {
      color: var(--section-accent, var(--color-text-main));
      // Replaced hardcoded shadow with cyber-text-glow or simplified shadow
      box-shadow: 0 0 var(--blur-sm)
        theme-color(var(--section-accent, var(--color-category-main)), 20%);
      transform: translateX(4px);

      .l-global-nav__link-icon {
        color: var(--section-accent, var(--color-category-main));
        filter: drop-shadow(
          0 0 4px
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
      @include ui-blinking-cursor(6px, 14px, currentcolor);

      .l-global-nav__link-text {
        font-weight: var(--font-weight-bold);
      }

      .l-global-nav__link-icon {
        color: var(--section-accent, var(--color-category-main));
        filter: drop-shadow(
          0 0 4px var(--section-accent, var(--color-category-main))
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

  @include mq("lg") {
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
      opacity var(--duration-normal) var(--ease-out),
      visibility var(--duration-normal) var(--ease-out);

    &.is-open {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }
  }
}
</style>
