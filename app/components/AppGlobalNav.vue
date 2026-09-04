<script setup lang="ts">
/**
 * AppGlobalNav
 * アプリケーションのグローバルナビゲーション（サイドバーメニュー）を表示するコンポーネントです。
 */
import { NuxtLink } from '#components'
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
    <nav class="c-global-nav__nav">
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

        <div class="c-global-nav__list">
          <component
            :is="item.disabled ? 'button' : NuxtLink"
            v-for="item in section.items"
            :key="item.href"
            :to="item.disabled ? undefined : item.href"
            :type="item.disabled ? 'button' : undefined"
            :disabled="item.disabled || undefined"
            class="c-global-nav__link"
            @click="item.disabled ? undefined : closeSidebar()"
          >
            <AppIcon :name="item.icon" size="md" />
            <span class="c-global-nav__link-text">{{ item.text }}</span>
          </component>
        </div>
      </section>
    </nav>
  </aside>
</template>

<style scoped lang="scss">
.c-global-nav {
  @include flex-start-stretch($direction: column);

  width: var(--sidebar-width);
  height: 100dvh;

  @include state-base("md", var(--transition-slow));

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
    gap: var(--space-4);
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
    --section-accent: var(--color-category-main);

    @include flex-start-stretch($direction: column);

    gap: var(--space-1);

    @each $name, $var in $accents {
      &.has-accent-#{$name} {
        --section-accent: #{$var};
      }
    }
  }

  &__section-header {
    padding: var(--space-1) var(--space-3);

    :deep(.c-section-header__title) {
      color: var(--section-accent);
    }
  }

  &__list {
    @include flex-start-stretch($direction: column);

    gap: var(--space-2);
  }

  &__link {
    @include text-title("sm", "medium");
    @include flex-start-center;

    gap: var(--space-2);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);

    @include state-base;

    &-text {
      word-break: keep-all; // 句読点やスペース、記号（・など）の区切りでのみ改行を許可
      line-break: strict;
      overflow-wrap: anywhere; // 万が一収まらない場合は強制改行
    }

    &:disabled {
      @include disabled;
    }

    &:not(:disabled) {
      &:is(:hover, :focus-visible, .router-link-active) {
        color: var(--section-accent);

        :deep(.c-icon) {
          filter: drop-shadow(
            0 0 var(--blur-sm) var(--section-accent)
          );
        }
      }

      &:is(:hover, :focus-visible):not(.router-link-active) {
        transform: translateX(var(--space-1));

        @include state-hover(var(--section-accent));
      }

      &:active {
        @include state-active(var(--section-accent));
      }

      &.router-link-active {
        @include state-active(var(--section-accent));
        @include blinking-cursor(
          var(--space-1),
          var(--font-size-base),
          currentcolor
        );
      }
    }
  }
}

.c-global-nav-overlay {
  display: none; // Hidden on desktop

  @include mq("md") {
    position: fixed;
    z-index: var(--z-index-sidebar-overlay);
    inset: 0;

    display: block;

    visibility: hidden;
    opacity: 0;
    backdrop-filter: blur(var(--blur-sm));

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
