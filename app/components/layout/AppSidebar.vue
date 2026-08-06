<script setup lang="ts">
import AppIcon from '../elements/AppIcon.vue'

export type MenuItem = {
  text: string
  href: string
  icon: string
  disabled?: boolean
}

export type MenuSection = {
  id?: string
  heading?: string
  globalNavHeading?: string
  accent?: 'tool' | 'database' | 'reference' | 'management' | 'main' | 'primary' | 'success' | 'warning' | 'danger'
  items: MenuItem[]
}

const props = defineProps<{
  menuData: MenuSection[]
}>()

// For mobile responsive toggle
const isOpen = defineModel<boolean>('isOpen', { default: false })

// Close sidebar on mobile when a link is clicked
const closeSidebar = () => {
  isOpen.value = false
}
</script>

<template>
  <div>
    <!-- Mobile Overlay -->
    <div 
      class="l-sidebar-overlay" 
      :class="{ 'is-open': isOpen }"
      @click="closeSidebar"
    ></div>

    <!-- Sidebar -->
    <aside class="l-sidebar" :class="{ 'is-open': isOpen }">
      <!-- Logo Header -->
      <header class="l-sidebar__header">
        <NuxtLink to="/" class="c-logo" @click="closeSidebar">
          <AppIcon name="zap" class="c-logo__icon" />
          <span class="c-logo__text">Elec-Console</span>
        </NuxtLink>
      </header>

      <!-- Navigation Content -->
      <nav class="l-sidebar__nav custom-scrollbar">
        <section 
          v-for="section in menuData" 
          :key="section.id || section.heading || section.globalNavHeading"
          class="l-sidebar__section"
          :class="section.accent ? `has-accent-${section.accent}` : ''"
        >
          <header v-if="section.globalNavHeading || section.heading" class="l-sidebar__section-header">
            <h3 class="l-sidebar__heading">{{ section.globalNavHeading || section.heading }}</h3>
            <AppDivider type="fade-side" :variant="section.accent || 'main'" class="l-sidebar__divider" />
          </header>

          <template v-for="item in section.items" :key="item.href">
            <NuxtLink
              v-if="!item.disabled"
              :to="item.href"
              class="l-sidebar__link"
              @click="closeSidebar"
            >
              <AppIcon :name="item.icon" class="l-sidebar__link-icon" />
              <span class="l-sidebar__link-text">{{ item.text }}</span>
            </NuxtLink>

            <div
              v-else
              class="l-sidebar__link is-disabled"
            >
              <AppIcon :name="item.icon" class="l-sidebar__link-icon" />
              <span class="l-sidebar__link-text">{{ item.text }}</span>
            </div>
          </template>
        </section>
      </nav>
    </aside>
  </div>
</template>

<style scoped lang="scss">
.l-sidebar {
  --sidebar-width: 260px;
  --sidebar-bg: #{glass-color(20%)};
  --sidebar-border: #{glass-color(30%)};

  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  width: var(--sidebar-width);
  height: 100dvh;
  background-color: transparent;
  border-right: var(--border-width-base) solid var(--sidebar-border);
  box-shadow: 4px 0 24px #{glass-color(10%)};
  transition: transform var(--duration-normal) var(--ease-out-back);

  // Mobile layout (hide by default)
  @include mq('lg') {
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
    box-shadow: 0 4px 12px #{glass-color(5%)};
  }

  .c-logo {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    text-decoration: none;
    color: var(--color-text-main);
    transition: var(--transition-base);

    &:hover {
      .c-logo__icon {
        @include cyber-text-glow(60%, 8px, var(--color-category-main));
        transform: scale(1.1);
      }
    }

    &__icon {
      color: var(--color-category-main);
      width: 24px;
      height: 24px;
      transition: var(--transition-base);
    }

    &__text {
      font-size: var(--text-lg);
      font-weight: var(--font-weight-bold);
      letter-spacing: 0.05em;
    }
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
    &.has-accent-primary, &.has-accent-main { --section-accent: var(--color-category-main); }
    &.has-accent-success { --section-accent: var(--color-status-success); }
    &.has-accent-warning { --section-accent: var(--color-status-warning); }
    &.has-accent-danger { --section-accent: var(--color-status-danger); }
    
    // Category Accents
    &.has-accent-tool { --section-accent: var(--color-category-tool); }
    &.has-accent-database { --section-accent: var(--color-category-database); }
    &.has-accent-reference { --section-accent: var(--color-category-reference); }
    &.has-accent-management { --section-accent: var(--color-category-management); }
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
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
    transition: var(--transition-base);

    &-icon {
      width: 18px;
      height: 18px;
      transition: var(--transition-base);
    }

    // Hover
    &:hover:not(.is-disabled):not(.router-link-active) {
      color: var(--section-accent, var(--color-text-main));
      box-shadow: 0 0 8px theme-color(var(--section-accent, var(--color-category-main)), 20%);
      transform: translateX(4px);

      .l-sidebar__link-icon {
        color: var(--section-accent, var(--color-category-main));
        filter: drop-shadow(0 0 4px theme-color(var(--section-accent, var(--color-category-main)), 80%));
      }
    }

    // Active
    &.router-link-active {
      color: var(--section-accent, var(--color-category-main));
      background-color: transparent;
      border-color: transparent;
      transform: translateX(0);
      @include ui-active(var(--section-accent, var(--color-category-main)));
      @include ui-blinking-cursor(6px, 14px, currentcolor);

      .l-sidebar__link-text {
        font-weight: var(--font-weight-bold);
      }
      
      .l-sidebar__link-icon {
        color: var(--section-accent, var(--color-category-main));
        filter: drop-shadow(0 0 4px var(--section-accent, var(--color-category-main)));
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
.l-sidebar-overlay {
  display: none; // Hidden on desktop

  @include mq('lg') {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 90; // Just below sidebar (100)
    width: 100vw;
    height: 100dvh;
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(2px);
    opacity: 0;
    visibility: hidden;
    transition: opacity var(--duration-normal) var(--ease-out),
                visibility var(--duration-normal) var(--ease-out);

    &.is-open {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }
  }
}

</style>
