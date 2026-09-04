<script setup lang="ts">
/**
 * AppGlobalNav
 * アプリケーションのグローバルナビゲーション（サイドバーメニュー）を表示するコンポーネントです。
 */
import type { MenuSection } from '~/constants/data/menuData'

const isOpen = defineModel<boolean>('isOpen', { default: false })

defineProps<{
  menuData: MenuSection[]
}>()

const closeSidebar = () => {
  isOpen.value = false
}
</script>

<template>
  <div
    class="c-global-nav-overlay"
    :class="{ 'is-open': isOpen }"
    @click="closeSidebar"
  />

  <aside class="c-global-nav" :class="{ 'is-open': isOpen }">
    <nav class="c-global-nav__nav custom-scrollbar">
      <section
        v-for="section in menuData"
        :key="section.id || section.heading || section.globalNavHeading"
        class="c-global-nav__section"
        :class="section.accent ? `has-accent-${section.accent}` : ''"
      >
        <AppSectionHeader
          v-if="section.globalNavHeading || section.heading"
          :title="section.globalNavHeading || section.heading"
          tag="h3"
          size="xs"
          :variant="section.accent || 'main'"
          divider-type="fade-side"
          class="c-global-nav__section-header"
        />

        <template v-for="item in section.items" :key="item.href">
          <NuxtLink
            v-if="!item.disabled"
            :to="item.href"
            class="c-global-nav__link"
            @click="closeSidebar"
          >
            <AppIcon :name="item.icon" class="c-global-nav__link-icon" />
            <span>{{ item.text }}</span>
          </NuxtLink>

          <button v-else disabled class="c-global-nav__link">
            <AppIcon :name="item.icon" class="c-global-nav__link-icon" />
            <span>{{ item.text }}</span>
          </button>
        </template>
      </section>
    </nav>
  </aside>
</template>

<style scoped lang="scss">
.c-global-nav {
  @include flex-start-stretch($direction: column);

  position: relative;
  z-index: 1;

  width: var(--sidebar-width);
  height: 100dvh;

  box-shadow: var(--shadow-elevation-md);

  transition: var(--transition-slow);

  // Mobile layout (hide by default, fixed drawer)
  @include mq("md") {
    position: fixed;
    z-index: var(--z-index-sidebar);
    top: 0;
    left: 0;
    transform: translateX(-100%);

    &.is-open {
      transform: translateX(0);
    }
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
    $accents: (
      "primary": var(--color-category-main),
      "tool": var(--color-category-tool),
      "database": var(--color-category-database),
      "reference": var(--color-category-reference),
      "management": var(--color-category-management),
    );

    @each $name, $var in $accents {
      &.has-accent-#{$name} {
        --section-accent: #{$var};
      }
    }
  }

  &__section-header {
    padding: var(--space-2) var(--space-3);

    :deep(.c-section-header__title) {
      color: var(--section-accent, var(--color-text-secondary));
    }
  }

  &__link {
    @include text-title("sm", "medium");
    @include flex-start-center;

    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
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

    &:is(:hover, :focus-visible):not(:disabled, .router-link-active) {
      transform: translateX(var(--space-1));
      color: var(--section-accent, var(--color-category-main));
      background-color: color-mix(
        in srgb,
        var(--section-accent, var(--color-category-main, transparent)),
        20%
      );

      @include state-hover(var(--section-accent, var(--color-category-main)));

      .c-global-nav__link-icon {
        color: var(--section-accent, var(--color-category-main));
        filter: drop-shadow(
          0 0 var(--blur-sm)
            color-mix(
              in srgb,
              var(--section-accent, var(--color-category-main, transparent)),
              80%
            )
        );
      }
    }

    &:active:not(:disabled) {
      @include state-active(var(--section-accent, var(--color-category-main)));
    }

    &.router-link-active {
      --glow-color: var(--section-accent, var(--color-category-main));

      transform: translateX(0);
      border-color: var(--section-accent, var(--color-category-main));
      color: var(--section-accent, var(--color-category-main));

      @include state-active(var(--section-accent, var(--color-category-main)));
      @include blinking-cursor(
        var(--space-1),
        var(--font-size-base),
        currentcolor
      );

      .c-global-nav__link-icon {
        color: var(--section-accent, var(--color-category-main));
        filter: drop-shadow(
          0 0 var(--blur-sm) var(--section-accent, var(--color-category-main))
        );
      }
    }

    &:disabled {
      filter: grayscale(100%);

      @include disabled;
    }
  }
}

.c-global-nav-overlay {
  display: none; // Hidden on desktop

  @include mq("md") {
    position: fixed;
    z-index: var(--z-index-sidebar-overlay); // Just below sidebar (102)
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
