<script setup lang="ts">
/**
 * GlobalNav
 * [Organisms] アプリケーションのグローバルナビゲーション（ドロワーサイドバー）。
 * オーバーレイ、閉じるボタン、セクション別メニューリンクを表示します。
 */
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'

import { useAuth } from '~/composables/useAuth'
import { menuData as defaultMenuData, type MenuItem } from '~/constants/data/menuData'
import type { GlobalNavProps } from '~/types/components'

const isOpenModel = defineModel<boolean>('isOpen')

withDefaults(defineProps<GlobalNavProps>(), {
  menuData: () => defaultMenuData,
})

const sidebarOpenState = useState('sidebar-open', () => false)

const isOpen = computed({
  get: () => (isOpenModel.value !== undefined ? isOpenModel.value : sidebarOpenState.value),
  set: (val: boolean) => {
    if (isOpenModel.value !== undefined) {
      isOpenModel.value = val
    }
    sidebarOpenState.value = val
  },
})

const { isMaster } = useAuth()
const route = useRoute()

const getVisibleItems = (items: MenuItem[]) => {
  return items.filter(item => !item.masterOnly || isMaster.value)
}

const isItemActive = (item: MenuItem) => {
  if (route.path === item.href) return true
  if (item.href === '/') return false

  if (item.href === '/portal' && route.path.startsWith('/portal/admin')) {
    return false
  }

  if (item.activePrefixes?.some(prefix => route.path.startsWith(prefix))) {
    return true
  }

  return route.path.startsWith(`${item.href}/`)
}

const closeSidebar = () => {
  isOpen.value = false
}

watch(() => route.fullPath, closeSidebar)
</script>

<template>
  <div
    class="fixed inset-0 z-[var(--z-index-sidebar-overlay)] overlay"
    :class="{ 'is-open': isOpen }"
    @click="closeSidebar"
  />

  <aside
    class="fixed top-0 left-0 z-[var(--z-index-sidebar)] flex flex-col w-[var(--sidebar-width)] h-[100dvh]"
    :class="{ 'is-open': isOpen }"
  >
    <header class="flex items-center justify-between h-16 px-4">
      <span class="header-title">
        メニュー
      </span>
      <Button
        icon="x"
        icon-only
        title="メニューを閉じる"
        @click="closeSidebar"
      />
    </header>

    <nav
      class="flex-1 overflow-y-auto flex flex-col gap-4 p-3"
      @click="closeSidebar"
    >
      <section
        v-for="section in menuData"
        :key="section.id"
        class="flex flex-col gap-1"
        :style="{
          '--section-accent': `var(--color-category-${section.accent || 'main'})`,
        }"
      >
        <SectionHeader
          v-if="section.globalNavHeading || section.heading"
          :title="section.globalNavHeading || section.heading"
          :icon="section.icon"
          tag="h5"
          class="px-2"
        />

        <div class="flex flex-col gap-1">
          <NuxtLink
            v-for="item in getVisibleItems(section.items)"
            :key="item.href"
            :to="item.href"
            class="w-full flex items-center gap-2 py-1 px-3"
            :class="{ 'is-active': isItemActive(item) }"
          >
            <Icon :name="item.icon" size="md" />
            <span>{{ item.text }}</span>
          </NuxtLink>
        </div>
      </section>
    </nav>
  </aside>
</template>

<style scoped lang="scss">
.overlay {
  pointer-events: none;

  visibility: hidden;
  opacity: 0;
  background-color: var(--color-overlay-dark);
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

aside {
  transform: translateX(-100%);

  border-right: var(--border-width-base) solid var(--color-border);

  background-color: var(--surface-bg-solid);
  box-shadow: var(--shadow-nav);

  transition: transform var(--duration-slow) var(--ease-base);

  &.is-open {
    transform: translateX(0);
  }

  header {
    border-bottom: var(--border-width-base) solid var(--color-border);

    .header-title {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-muted);
      letter-spacing: var(--tracking-wider);
    }
  }

  nav {
    --scrollbar-size: var(--space-2);
  }

  a {
    border: var(--border-width-base) solid transparent;

    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    line-height: var(--line-height-tight);
    color: var(--color-text-secondary);
    letter-spacing: var(--tracking-wide);

    transition: var(--transition-interactive);

    &:hover,
    &:focus-visible {
      color: var(--color-text-main);
      background-color: color-mix(in srgb, var(--section-accent) 8%, transparent);
    }

    &:active,
    &.is-active {
      border-color: color-mix(in srgb, var(--section-accent) 55%, transparent);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-main);
      background-color: color-mix(in srgb, var(--section-accent) 12%, transparent);
    }
  }
}
</style>
