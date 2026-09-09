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
      <AtomsLogo @click="closeSidebar" />
      <MoleculesIconButton
        name="x"
        size="sm"
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
        <div
          v-if="section.globalNavHeading || section.heading"
          class="flex flex-col gap-1 section-title-wrap"
        >
          <h3 class="section-title">
            {{ section.globalNavHeading || section.heading }}
          </h3>
          <AtomsDivider color="var(--section-accent)" type="fade-side" />
        </div>

        <ul class="list">
          <li
            v-for="item in section.items"
            :key="item.href"
            class="nav-item"
          >
            <component
              :is="item.disabled ? 'button' : NuxtLink"
              :to="item.disabled ? undefined : item.href"
              :type="item.disabled ? 'button' : undefined"
              :disabled="item.disabled || undefined"
              class="nav-link"
              @click="item.disabled ? undefined : closeSidebar()"
            >
              <AtomsIcon :name="item.icon" size="md" />
              <span class="nav-link-text">{{ item.text }}</span>
            </component>
          </li>
        </ul>
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
  box-shadow: var(--shadow-nav);

  transition: transform var(--duration-slow) var(--ease-base);

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

.section-title-wrap {
  padding: var(--space-1) var(--space-3);
}

.section-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text-main);
  letter-spacing: var(--tracking-wider);
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);

  margin: 0;
  padding: 0;

  list-style: none;
}

.nav-item {
  display: flex;
  margin: 0;
  padding: 0;
}

.nav-link {
  --nav-glow-hover:
    0 0 4px color-mix(in srgb, var(--section-accent) 45%, transparent),
    0 0 8px color-mix(in srgb, var(--section-accent) 20%, transparent);
  --nav-glow-active:
    0 0 4px color-mix(in srgb, var(--section-accent) 60%, transparent),
    0 0 8px color-mix(in srgb, var(--section-accent) 30%, transparent),
    inset 0 0 2px color-mix(in srgb, var(--section-accent) 40%, transparent);
  --nav-icon-glow: drop-shadow(0 0 var(--blur-sm) var(--section-accent));

  display: flex;
  gap: var(--space-2);
  align-items: center;

  width: 100%;
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

    box-shadow: var(--nav-glow-hover);

    transition: var(--transition-glow);

    :deep(.icon) {
      filter: var(--nav-icon-glow);
    }
  }

  &:active,
  &.router-link-active {
    transform: none;

    border-color: var(--section-accent);

    color: var(--section-accent);

    box-shadow: var(--nav-glow-active);

    transition: var(--transition-glow);

    :deep(.icon) {
      filter: var(--nav-icon-glow);
    }
  }

  &.router-link-active {
    display: inline-flex;
    gap: var(--space-1);
    align-items: center;
  }

  &.router-link-active::after {
    content: "";

    display: inline-block;

    width: var(--space-1);
    height: var(--font-size-base);

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
</style>
