<script setup lang="ts">
/**
 * OrganismsGlobalNav
 * [Organisms] アプリケーションのグローバルナビゲーション（ドロワーサイドバー）。
 * オーバーレイ、閉じるボタンヘッダー、セクション別メニューリンク（ホバー・アクティブ発光演出）を表示します。
 */
import { onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'

import { NuxtLink } from '#components'
import { useAuth } from '~/composables/useAuth'
import type { MenuItem } from '~/constants/data/menuData'
import type { OrganismsGlobalNavProps } from '~/types/components'

const isOpen = defineModel<boolean>('isOpen', { default: false })

defineProps<OrganismsGlobalNavProps>()

const { isMaster } = useAuth()

const getVisibleItems = (items: MenuItem[]) => {
  return items.filter(item => !item.masterOnly || isMaster.value)
}

const closeSidebar = () => {
  isOpen.value = false
}

const route = useRoute()

watch(() => route.fullPath, () => {
  isOpen.value = false
})

onMounted(() => {
  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen.value) {
      isOpen.value = false
    }
  }

  window.addEventListener('keydown', onKeydown)
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))
})
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
    <header class="flex items-center justify-between h-16 px-[var(--space-4)]">
      <span class="header-title">
        メニュー
      </span>
      <AtomsButton
        variant="ghost"
        icon="x"
        icon-only
        @click="closeSidebar"
      />
    </header>

    <nav class="flex-1 overflow-y-auto flex flex-col gap-[var(--space-4)] p-[var(--space-3)]">
      <section
        v-for="section in menuData"
        :key="section.id || section.heading || section.globalNavHeading"
        class="flex flex-col gap-[var(--space-1)]"
        :style="{
          '--section-accent': `var(--color-category-${section.accent || 'main'})`,
        }"
      >
        <MoleculesSectionHeader
          v-if="section.globalNavHeading || section.heading"
          :title="section.globalNavHeading || section.heading"
          :icon="section.icon"
          :variant="section.accent || 'main'"
          size="xs"
          tag="h3"
          class="px-[var(--space-2)]"
        />

        <div class="flex flex-col gap-[var(--space-1)]">
          <component
            :is="item.disabled ? 'button' : NuxtLink"
            v-for="item in getVisibleItems(section.items)"
            :key="item.href"
            :to="item.disabled ? undefined : item.href"
            :type="item.disabled ? 'button' : undefined"
            :disabled="item.disabled || undefined"
            class="w-full flex items-center gap-[var(--space-2)] py-[var(--space-1)] px-[var(--space-3)]"
            @click="item.disabled ? undefined : closeSidebar()"
          >
            <AtomsIcon :name="item.icon" size="md" />
            <span>{{ item.text }}</span>
          </component>
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

  section {
    --glow-color: var(--section-accent);
  }

  a,
  button {
    border: var(--border-width-base) solid transparent;
    border-radius: var(--radius-sm);

    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    line-height: var(--line-height-tight);
    color: var(--color-text-secondary);
    letter-spacing: var(--tracking-wide);

    transition: var(--transition-interactive);

    span {
      word-break: keep-all;
      overflow-wrap: anywhere;
    }

    &:hover,
    &:focus-visible {
      color: var(--color-text-main);
      background-color: var(--color-bg-hover);
    }

    &:active,
    &.router-link-active {
      border-color: color-mix(in srgb, var(--section-accent) 30%, transparent);
      font-weight: var(--font-weight-semibold);
      color: var(--section-accent);
      background-color: color-mix(in srgb, var(--section-accent) 12%, transparent);

      &::after {
        content: "";

        display: inline-block;

        width: var(--space-1);
        height: var(--font-size-base);

        vertical-align: middle;

        background-color: currentcolor;

        animation: ui-cursor-blink 1s step-end infinite;
      }
    }

    @include state-disabled;
  }
}
</style>
