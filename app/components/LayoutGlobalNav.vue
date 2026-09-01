<script setup lang="ts">
/**
 * LayoutGlobalNav
 * アプリケーションのグローバルナビゲーション（サイドバーメニュー）を表示するコンポーネントです。
 */
import type { MenuSection } from '~/constants/data/menuData'

/** For mobile responsive toggle */
const isOpen = defineModel<boolean>('isOpen', { default: false })

defineProps<{
  menuData: MenuSection[]
}>()

/** Close sidebar on mobile when a link is clicked */
const closeSidebar = () => {
  isOpen.value = false
}
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
    <aside
      class="l-global-nav"
      :class="{ 'is-open': isOpen }"
    >
      <!-- Logo Header -->
      <header class="l-global-nav__header">
        <LayoutLogo @click="closeSidebar" />
      </header>
      <AppDivider
        type="fade-center"
        variant="sidebar-border"
      />

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

          <template
            v-for="item in section.items"
            :key="item.href"
          >
            <NuxtLink
              v-if="!item.disabled"
              :to="item.href"
              class="l-global-nav__link"
              @click="closeSidebar"
            >
              <AppIcon
                :name="item.icon"
                class="l-global-nav__link-icon"
              />
              <span>{{ item.text }}</span>
            </NuxtLink>

            <div
              v-else
              class="l-global-nav__link is-disabled"
            >
              <AppIcon
                :name="item.icon"
                class="l-global-nav__link-icon"
              />
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
  --sidebar-border: var(--color-border);

  @include flex-start-stretch($direction: column);

  position: fixed;
  z-index: var(--z-index-nav);
  width: var(--sidebar-width);
  height: 100dvh;

  @include state-base(
    var(--shadow-elevation-md),
    transform var(--duration-slow) var(--ease-smooth)
  );

  // Mobile layout (hide by default)
  @include mq("md") {
    transform: translateX(-100%);

    &.is-open {
      transform: translateX(0);
    }
  }

  &__header {
    @include flex-start-center;

    flex-shrink: 0;
    height: 64px; // Match standard header height
    padding: 0 var(--space-3);

    @include shadow("sm"); // Replaced hardcoded shadow
  }

  &__nav {
    --scrollbar-size: var(--space-2);

    @include flex-start-stretch($direction: column);

    overflow-y: auto;
    flex: 1;
    gap: var(--space-card-gap);
    padding: var(--space-3);
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
      "management": var(--color-category-management),
    );

    @include flex-start-stretch($direction: column);

    @each $name, $var in $accents {
      &.has-accent-#{$name} {
        --section-accent: #{$var};
      }
    }
  }

  &__section-header {
    @include flex-start-stretch($direction: column);

    gap: var(--space-1);
    padding: var(--space-2) var(--space-3);
  }

  &__heading {
    @include text-badge;

    color: var(--section-accent, var(--color-text-secondary));
  }

  &__link {
    @include text-title("sm", "medium");
    @include flex-start-center;

    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    color: var(--color-text-secondary);

    @include state-base;

    &-text {
      word-break: keep-all; // 句読点やスペース、記号（・など）の区切りでのみ改行を許可
      line-break: strict;
      overflow-wrap: anywhere; // 万が一収まらない場合は強制改行
    }

    &-icon {
      flex-shrink: 0; // アイコンが潰れないように
      width: var(--icon-size-md);
      height: var(--icon-size-md);

      @include state-base;
    }

    // Hover & Focus
    &:is(:hover, :focus-visible):not(.is-disabled, .router-link-active) {
      transform: translateX(var(--space-1));
      color: var(--section-accent, var(--color-category-main));
      background-color: color-mix(
        in srgb,
        var(--section-accent, var(--color-category-main, transparent)),
        20%
      );

      @include state-hover;

      .l-global-nav__link-icon {
        color: var(--section-accent, var(--color-category-main));
        filter: drop-shadow(
          0 0 var(--blur-sm)
            color-mix(in srgb, var(--section-accent, var(--color-category-main, transparent)), 80%)
        );
      }
    }

    // Press (Active)
    &:active:not(.is-disabled) {
      @include state-active(var(--section-accent, var(--color-category-main)));
    }

    // Selected Route (Active Page)
    &.router-link-active {
      --glow-color: var(--section-accent, var(--color-category-main));

      transform: translateX(0);
      border-color: var(--section-accent, var(--color-category-main));
      color: var(--section-accent, var(--color-category-main));

      @include state-active(var(--color-category-main));
      @include blinking-cursor(
        var(--space-1),
        var(--font-size-base),
        currentcolor
      );

      .l-global-nav__link-icon {
        color: var(--section-accent, var(--color-category-main));
        filter: drop-shadow(
          0 0 var(--blur-sm) var(--section-accent, var(--color-category-main))
        );
      }
    }

    // Disabled

    &.is-disabled {
      filter: grayscale(100%);

      @include disabled;
    }
  }
}

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
      opacity var(--duration-slow) var(--ease-base),
      visibility var(--duration-slow) var(--ease-base);

    &.is-open {
      pointer-events: auto;
      visibility: visible;
      opacity: 1;
    }
  }
}
</style>
