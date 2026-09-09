<script setup lang="ts">
/**
 * OrganismsGlobalNav
 * [Organisms] アプリケーションのグローバルナビゲーション（ドロワーサイドバー）。
 * オーバーレイ、ロゴ・閉じるボタンヘッダー、セクション別メニューリンク（ホバー・アクティブ発光演出）を表示します。
 */
import { onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'

import { NuxtLink } from '#components'
import type { OrganismsGlobalNavProps } from '~/types/components'

const isOpen = defineModel<boolean>('isOpen', { default: false })

defineProps<OrganismsGlobalNavProps>()

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
    class="fixed top-0 left-0 z-[var(--z-index-sidebar)] flex flex-col w-[var(--sidebar-width)] h-[100dvh] global-nav"
    :class="{ 'is-open': isOpen }"
  >
    <header class="flex items-center justify-between h-16 px-[var(--space-4)] header">
      <AtomsLogo @click="closeSidebar" />
      <MoleculesIconButton
        name="x"
        size="sm"
        @click="closeSidebar"
      />
    </header>

    <nav class="flex-1 overflow-y-auto flex flex-col gap-[var(--space-4)] p-[var(--space-3)] nav">
      <section
        v-for="section in menuData"
        :key="section.id || section.heading || section.globalNavHeading"
        class="flex flex-col gap-[var(--space-1)] section"
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
            v-for="item in section.items"
            :key="item.href"
            :to="item.disabled ? undefined : item.href"
            :type="item.disabled ? 'button' : undefined"
            :disabled="item.disabled || undefined"
            class="w-full flex items-center gap-[var(--space-2)] py-[var(--space-1)] px-[var(--space-3)] nav-link"
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

.global-nav {
  transform: translateX(-100%);

  border-right: var(--border-width-base) solid var(--color-border);

  background-color: var(--surface-bg-solid);
  box-shadow: var(--shadow-nav);

  transition: transform var(--duration-slow) var(--ease-base);

  &.is-open {
    transform: translateX(0);
  }
}

.header {
  border-bottom: var(--border-width-base) solid var(--color-border);
  background-color: var(--surface-bg-elevated);
}

.nav {
  --scrollbar-size: var(--space-2);
}

.section {
  --glow-color: var(--section-accent);
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

  border: var(--border-width-base) solid transparent;
  border-radius: var(--radius-sm);

  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
  color: var(--color-text-secondary);
  letter-spacing: var(--tracking-wide);

  transition: var(--transition-base);

  span {
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
}
</style>
