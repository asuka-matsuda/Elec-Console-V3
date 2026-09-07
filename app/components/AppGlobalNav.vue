<script setup lang="ts">
/**
 * AppGlobalNav
 * アプリケーションのグローバルナビゲーション（サイドバーメニュー）を表示するコンポーネントです。
 */
import { onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'

import { NuxtLink } from '#components'
import type { MenuSection } from '~/constants/data/menuData'

const isOpen = defineModel<boolean>('isOpen', { default: false })

defineProps<Props>()

interface Props {
  menuData: MenuSection[]
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
    class="overlay"
    :class="{ 'is-open': isOpen }"
    @click="closeSidebar"
  />

  <aside class="global-nav" :class="{ 'is-open': isOpen }">
    <div class="header">
      <AppLogo @click="closeSidebar" />
      <AppIconButton
        name="x"
        size="sm"
        variant="secondary"
        @click="closeSidebar"
      />
    </div>

    <nav class="nav">
      <section
        v-for="section in menuData"
        :key="section.id || section.heading || section.globalNavHeading"
        class="section"
        :style="{
          '--section-accent': `var(--color-category-${section.accent || 'main'})`,
        }"
      >
        <AppSectionHeader
          v-if="section.globalNavHeading || section.heading"
          :title="section.globalNavHeading || section.heading"
          tag="h3"
          size="xs"
          :variant="section.accent || 'main'"
          divider-type="fade-side"
          class="section-header"
        />

        <div class="list">
          <component
            :is="item.disabled ? 'button' : NuxtLink"
            v-for="item in section.items"
            :key="item.href"
            :to="item.disabled ? undefined : item.href"
            :type="item.disabled ? 'button' : undefined"
            :disabled="item.disabled || undefined"
            class="nav-link"
            @click="item.disabled ? undefined : closeSidebar()"
          >
            <AppIcon :name="item.icon" size="md" />
            <span class="nav-link-text">{{ item.text }}</span>
          </component>
        </div>
      </section>
    </nav>
  </aside>
</template>

<style scoped lang="scss">
.global-nav {
  position: fixed;
  z-index: var(--z-index-sidebar);
  top: 0;
  left: 0;
  transform: translateX(-100%);

  display: flex;
  flex-direction: column;

  width: var(--sidebar-width);
  height: 100dvh;
  border-right: var(--border-width-base) solid var(--color-border);

  background-color: var(--surface-bg-solid);
  box-shadow: 4px 0 24px rgb(0 0 0 / 50%);

  transition: transform var(--duration-slow, 0.3s) var(--ease-base);

  &.is-open {
    transform: translateX(0);
  }
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  height: 64px;
  padding: 0 var(--space-4);
  border-bottom: var(--border-width-base) solid var(--color-border);

  background-color: var(--surface-bg-elevated);
}

.nav {
  --scrollbar-size: var(--space-2);

  overflow-y: auto;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-4);

  padding: var(--space-3);
}

.section {
  --glow-color: var(--section-accent);

  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.section-header {
  padding: var(--space-1) var(--space-3);

  :deep(.c-section-header__title) {
    color: var(--color-text-main);
    letter-spacing: var(--tracking-wider);
  }

  :deep(.c-section-header__icon) {
    color: var(--section-accent);
    filter: var(--drop-shadow-glow-sm);
  }
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.nav-link {
  display: flex;
  gap: var(--space-2);
  align-items: center;

  padding: var(--space-1) var(--space-3);
  border: var(--border-width-base) solid transparent;
  border-radius: var(--radius-sm);

  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
  color: var(--color-text-secondary);
  letter-spacing: var(--tracking-wide);

  transition: var(--transition-base);

  &-text {
    word-break: keep-all;
    overflow-wrap: anywhere;
  }

  &:disabled {
    pointer-events: none;
    opacity: 0.5;
    filter: grayscale(100%);
  }

  &:hover,
  &:focus-visible {
    transform: translateX(var(--space-1));

    border-color: var(--section-accent);

    color: var(--section-accent);

    box-shadow: var(--shadow-glow-hover);

    transition: var(--transition-glow);

    :deep(.c-icon) {
      filter: var(--drop-shadow-glow-sm);
    }
  }

  &:active,
  &.router-link-active {
    transform: none;

    border-color: var(--section-accent);

    color: var(--section-accent);

    box-shadow: var(--shadow-glow-active);

    transition: var(--transition-glow);

    :deep(.c-icon) {
      filter: var(--drop-shadow-glow-sm);
    }
  }

  &.router-link-active::after {
    content: "";

    display: inline-block;

    width: var(--space-1);
    height: var(--font-size-base);
    margin-left: var(--space-1);

    vertical-align: middle;

    background-color: currentcolor;

    animation: ui-cursor-blink 1s step-end infinite;
  }
}

.overlay {
  pointer-events: none;

  position: fixed;
  z-index: var(--z-index-sidebar-overlay);
  inset: 0;

  display: block;

  visibility: hidden;
  opacity: 0;
  background-color: rgb(0 0 0 / 50%);
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
</style>
