<script setup lang="ts">
/**
 * デフォルトレイアウト
 *
 * グローバルナビゲーション、ヘッダー、オフライン警告バナー、フッター、
 * およびパンくず連動のカテゴリアクセントカラーを提供します。
 */
import { useOnline, useTimeoutFn } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

const { accent, items: breadcrumbItems } = useBreadcrumbs()
const { isOpen: isSidebarOpen, toggleSidebar } = useSidebar()
const { getAccurateNow, currentUser, logout } = useAuth()
const currentYear = getAccurateNow().getFullYear()

const userName = computed(() => {
  if (!currentUser.value) return ''

  return `${currentUser.value.lastName} ${currentUser.value.firstName}`
})

// オフライン / 復帰 バナー制御
const isOnline = useOnline()
const showBackOnline = ref(false)
const isBannerDismissed = ref(false)

const { start: startOnlineTimer, stop: stopOnlineTimer } = useTimeoutFn(() => {
  showBackOnline.value = false
}, 4000, { immediate: false })

watch(isOnline, (online, wasOnline) => {
  isBannerDismissed.value = false

  if (online && wasOnline === false) {
    showBackOnline.value = true
    stopOnlineTimer()
    startOnlineTimer()
  }
  else if (!online) {
    stopOnlineTimer()
    showBackOnline.value = false
  }
})

const offlineBanner = computed(() => {
  if (isBannerDismissed.value) return null

  if (!isOnline.value) {
    return {
      variant: 'warning' as const,
      icon: 'wifi-off' as const,
      title: '圏外（オフライン）で動作中',
      sub: '入力データは端末（ローカル）に一時保存されます',
    }
  }

  if (showBackOnline.value) {
    return {
      variant: 'success' as const,
      icon: 'wifi' as const,
      title: 'オンラインに復帰しました',
      sub: '未同期データがある場合はバックグラウンドで自動同期されます',
    }
  }

  return null
})
</script>

<template>
  <div class="flex flex-1 flex-col min-h-0 min-w-0" :style="{ '--theme-accent': `var(--color-category-${accent || 'main'})` }">
    <GlobalNav v-model:is-open="isSidebarOpen" />
    <header class="flex h-16 items-center justify-between px-layout-pad app-header">
      <div class="flex items-center gap-item-gap">
        <Tooltip text="メニューを開閉" placement="bottom">
          <Button variant="tertiary" size="sm" icon="menu" @click="toggleSidebar" />
        </Tooltip>
        <NuxtLink to="/" class="flex items-center">
          <div class="flex shrink-0 items-center gap-item-gap logo">
            <Icon name="gauge" class="logo-icon" />
            <span>Elec-Console</span>
          </div>
        </NuxtLink>
      </div>

      <div class="flex items-center gap-item-gap">
        <Tooltip :text="userName" placement="bottom">
          <NuxtLink to="/mypage" class="flex items-center">
            <Avatar :text="userName" size="sm" />
          </NuxtLink>
        </Tooltip>

        <Button variant="secondary" size="sm" @click="logout">ログアウトする</Button>
      </div>
    </header>

    <Transition name="slide">
      <Banner v-if="offlineBanner" :variant="offlineBanner.variant" :icon="offlineBanner.icon" :title="offlineBanner.title" :sub="offlineBanner.sub" dismissible @close="isBannerDismissed = true" />
    </Transition>

    <main class="flex flex-1 flex-col min-h-0 overflow-y-auto p-layout-pad gap-panel-gap">
      <Breadcrumbs :items="breadcrumbItems" />
      <slot />
      <footer class="mt-auto flex flex-col items-center gap-item-gap pt-layout-pad text-center">
        <hr class="divider is-fade-center">
        <small>&copy; {{ currentYear }} Mat.Operate &amp; Gemini 3.8 Flash. / Elec-Console All rights reserved.</small>
      </footer>
    </main>
  </div>
</template>

<style scoped lang="scss">
.slide-enter-active,
.slide-leave-active {
  transition:
    max-height var(--duration-base) var(--ease-base),
    opacity var(--duration-fast) var(--ease-base);
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.app-header {
  border-bottom: var(--border-width-base) solid var(--color-border);
  background-color: var(--surface-bg);
}

.logo {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text-main);
  white-space: nowrap;
}

.logo-icon {
  color: var(--theme-accent);
}
</style>
