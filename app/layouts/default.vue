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
      status: 'offline' as const,
      icon: 'wifi-off' as const,
      title: '圏外（オフライン）で動作中',
      sub: '入力データは端末（ローカル）に一時保存されます',
    }
  }

  if (showBackOnline.value) {
    return {
      status: 'online' as const,
      icon: 'wifi' as const,
      title: 'オンラインに復帰しました',
      sub: '未同期データがある場合はバックグラウンドで自動同期されます',
    }
  }

  return null
})
</script>

<template>
  <div
    class="flex flex-1 flex-col min-h-0 min-w-0"
    :style="{ '--theme-accent': `var(--color-category-${accent || 'main'})` }"
  >
    <GlobalNav v-model:is-open="isSidebarOpen" />
    <header class="flex h-16 items-center justify-between px-layout-pad app-header">
      <div class="flex items-center gap-item-gap">
        <Button
          icon="menu"
          title="メニューを開閉"
          @click="toggleSidebar"
        />
        <NuxtLink to="/" class="flex items-center">
          <div class="flex shrink-0 items-center gap-item-gap logo">
            <Icon name="gauge" class="logo-icon" />
            <span>Elec-Console</span>
          </div>
        </NuxtLink>
      </div>

      <div class="flex items-center gap-item-gap">
        <NuxtLink
          to="/mypage"
          class="flex items-center gap-inline-gap"
        >
          <Icon
            name="user"
            size="sm"
          />
          <span class="max-md:hidden">
            {{ userName }}
          </span>
        </NuxtLink>

        <Button
          @click="logout"
        >
          ログアウト
        </Button>
      </div>
    </header>

    <Transition name="slide">
      <div
        v-if="offlineBanner"
        :class="['banner', offlineBanner.status, `is-${offlineBanner.status}`]"
        :data-status="offlineBanner.status"
      >
        <div class="flex items-center justify-between gap-item-gap py-inline-gap px-panel-pad">
          <div class="flex items-center gap-item-gap min-w-0">
            <Icon :name="offlineBanner.icon" />
            <div class="flex items-center gap-item-gap flex-wrap min-w-0">
              <strong>{{ offlineBanner.title }}</strong>
              <span class="sub">{{ offlineBanner.sub }}</span>
            </div>
          </div>

          <Button
            icon="x"
            class="close shrink-0"
            title="閉じる"
            @click="isBannerDismissed = true"
          />
        </div>
      </div>
    </Transition>

    <main class="flex flex-1 flex-col min-h-0 overflow-y-auto p-layout-pad gap-item-gap">
      <nav
        v-if="breadcrumbItems && breadcrumbItems.length > 0"
        class="flex shrink-0 items-center whitespace-nowrap breadcrumb"
      >
        <ol class="flex items-center gap-item-gap">
          <li
            v-for="(item, index) in breadcrumbItems"
            :key="`${item.text}-${index}`"
            class="flex items-center gap-item-gap"
            :class="{
              'is-active': index === breadcrumbItems.length - 1,
              'has-cursor': index === breadcrumbItems.length - 1,
            }"
          >
            <span>{{ item.text }}</span>
            <span v-if="index < breadcrumbItems.length - 1" class="separator">»</span>
          </li>
        </ol>
      </nav>
      <slot />
      <footer class="mt-auto flex flex-col items-center gap-item-gap pt-layout-pad text-center">
        <hr class="divider is-fade-center">
        <small>
          &copy; {{ currentYear }} Mat.Operate &amp; Gemini 3.8 Flash. / Elec-Console All rights reserved.
        </small>
      </footer>
    </main>
  </div>
</template>

<style scoped lang="scss">
.breadcrumb {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  letter-spacing: var(--tracking-wide);

  li {
    color: var(--color-text-muted);

    &.is-active {
      font-weight: var(--font-weight-medium);
      color: var(--theme-accent);

      &.has-cursor::after {
        content: "";

        width: var(--space-1);
        height: var(--space-3);
        margin-inline-start: var(--space-1);

        background-color: var(--theme-accent);

        animation: ui-cursor-blink 1s step-end infinite;
      }
    }
  }

  .separator {
    font-size: 0.85em;
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-tight);
    color: color-mix(in srgb, var(--theme-accent) 60%, transparent);
    letter-spacing: var(--tracking-wider);
  }
}

@keyframes ui-cursor-blink {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}

.banner {
  overflow: hidden;

  max-height: 48px;
  border-bottom: var(--border-width-base) solid transparent;

  font-size: var(--font-size-xs);
  line-height: var(--line-height-tight);

  &.offline,
  &.is-offline {
    border-bottom-color: color-mix(in srgb, var(--color-status-warning) 40%, transparent);
    color: var(--color-status-warning);
    background-color: color-mix(in srgb, var(--color-status-warning) 12%, var(--surface-bg-solid));
  }

  &.online,
  &.is-online {
    border-bottom-color: color-mix(in srgb, var(--color-status-success) 40%, transparent);
    color: var(--color-status-success);
    background-color: color-mix(in srgb, var(--color-status-success) 12%, var(--surface-bg-solid));
  }

  .sub {
    font-size: var(--font-size-2xs);
    opacity: 0.8;
  }

  .close {
    width: 1.2em;
    height: 1.2em;
    padding: 0;
    border: none;

    color: currentcolor;

    opacity: 0.7;
    background: none;

    transition: opacity var(--duration-fast) var(--ease-base);

    @include state-interactive;

    &:hover {
      opacity: 1;
    }
  }
}

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
