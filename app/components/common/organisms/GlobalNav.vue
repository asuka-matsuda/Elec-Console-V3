<script setup lang="ts">
/**
 * GlobalNav
 * [Organisms] アプリケーションのグローバルナビゲーション（ドロワーサイドバー）。
 * オーバーレイ、閉じるボタン、セクション別メニューリンクを表示します。
 */
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'

import { useAuth } from '~/composables/useAuth'
import { useSidebar } from '~/composables/useSidebar'
import { menuData as defaultMenuData, type MenuItem } from '~/constants/data/menuData'
import type { GlobalNavProps } from '~/types/components'

const isOpenModel = defineModel<boolean | undefined>('isOpen', { default: undefined })

withDefaults(defineProps<GlobalNavProps>(), {
  menuData: () => defaultMenuData,
})

const { isOpen: sidebarOpenState, closeSidebar: closeGlobalSidebar } = useSidebar()

// 親コンポーネントが明示的に v-model:is-open または :is-open をバインドしているかどうか判定
const hasExplicitBinding = computed(() => isOpenModel.value !== undefined)

const isOpen = computed({
  get: () => (hasExplicitBinding.value ? !!isOpenModel.value : sidebarOpenState.value),
  set: (val: boolean) => {
    if (hasExplicitBinding.value) {
      isOpenModel.value = val
    }
    sidebarOpenState.value = val
  },
})

const { isMaster, isAdmin } = useAuth()
const route = useRoute()

const getVisibleItems = (items: MenuItem[]) => {
  return items.filter((item) => {
    if (item.masterOnly && !isMaster.value) return false
    if (item.adminOnly && !isAdmin.value) return false

    return true
  })
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
  closeGlobalSidebar()
}

watch(() => route.fullPath, closeSidebar)

onMounted(() => {
  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen.value) {
      closeSidebar()
    }
  }

  window.addEventListener('keydown', onKeydown)
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))
})
</script>

<template>
  <div class="fixed inset-0 z-sidebar-overlay overlay" :class="{ 'is-open': isOpen }" @click="closeSidebar" />

  <aside class="fixed top-0 left-0 z-sidebar flex flex-col w-sidebar-w h-[100dvh] overflow-hidden" :class="{ 'is-open': isOpen }">
    <header class="flex items-center justify-between h-16 px-layout-pad shrink-0">
      <span class="header-title">メニュー</span>
      <Button variant="tertiary" size="sm" icon="x" @click="closeSidebar" />
    </header>

    <nav class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-panel-gap p-panel-pad-compact" @click="closeSidebar">
      <template v-for="section in menuData" :key="section.id">
        <section v-if="getVisibleItems(section.items).length > 0" class="flex flex-col gap-inline-gap" :style="{ '--section-accent': `var(--color-category-${section.accent || 'main'})` }">
          <h5 v-if="section.globalNavHeading || section.heading" class="flex items-center gap-item-gap px-2 py-0.5 nav-heading">
            <Icon v-if="section.icon" :name="section.icon" size="sm" variant="accent" />
            <span>{{ section.globalNavHeading || section.heading }}</span>
          </h5>

          <ul class="flex flex-col gap-inline-gap">
            <li v-for="item in getVisibleItems(section.items)" :key="item.href">
              <NuxtLink :to="item.href" class="w-full flex items-center gap-item-gap py-1 px-panel-pad-compact" :class="{ 'is-active': isItemActive(item) }">
                <Icon :name="item.icon" size="md" />
                <span>{{ item.text }}</span>
              </NuxtLink>
            </li>
          </ul>
        </section>
      </template>
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
  background-image: var(--surface-gradient-base);
  backdrop-filter: blur(var(--blur-md));
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

  .nav-heading {
    color: var(--color-text-secondary);
  }

  a {
    --glow-color: var(--section-accent);

    @include control-glow-tokens;

    position: relative;

    border: var(--border-width-base) solid transparent;

    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    line-height: var(--line-height-ui);
    color: var(--color-text-secondary);
    letter-spacing: var(--tracking-normal);

    transition: var(--transition-interactive);

    &:hover,
    &:focus-visible {
      border-color: color-mix(in srgb, var(--section-accent) 28%, transparent);
      color: var(--color-text-main);
      background:
        linear-gradient(
          90deg,
          color-mix(in srgb, var(--section-accent) 10%, transparent) 0%,
          transparent 85%
        );
    }

    &:active,
    &.is-active {
      border-color: color-mix(in srgb, var(--section-accent) 48%, var(--color-border));

      font-weight: var(--font-weight-semibold);
      color: var(--color-text-main);

      background:
        linear-gradient(
          90deg,
          color-mix(in srgb, var(--section-accent) 16%, transparent) 0%,
          color-mix(in srgb, var(--section-accent) 4%, transparent) 60%,
          transparent 100%
        );
      box-shadow: var(--shadow-glow-sm);

      &::before {
        content: "";

        width: 6px;
        height: 6px;
        border-radius: var(--radius-circle);

        background-color: var(--section-accent);
        box-shadow: var(--shadow-glow-dot);
      }
    }
  }
}
</style>
