<script setup lang="ts">
/**
 * OfflineBanner
 * [Common Molecules] 電波状況（オフライン / 復帰）を伝える最小限のHUDバナー
 */
import { useOnline, useTimeoutFn } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

const isOnline = useOnline()
const showBackOnline = ref(false)

const { start: startOnlineTimer } = useTimeoutFn(() => {
  showBackOnline.value = false
}, 4000, { immediate: false })

watch(isOnline, (online, wasOnline) => {
  if (online && wasOnline === false) {
    showBackOnline.value = true
    startOnlineTimer()
  }
})

const banner = computed(() => {
  if (!isOnline.value) {
    return {
      statusClass: 'is-offline',
      icon: 'wifi-off',
      text: '圏外（オフライン）で動作中',
    }
  }
  if (showBackOnline.value) {
    return {
      statusClass: 'is-online',
      icon: 'wifi',
      text: 'オンラインに復帰しました',
    }
  }

  return null
})
</script>

<template>
  <Transition name="banner-fade">
    <div
      v-if="banner"
      :class="['offline-banner flex items-center justify-center gap-item-gap py-inline-gap px-panel-pad', banner.statusClass]"
    >
      <Icon :name="banner.icon" />
      <span><strong>{{ banner.text }}</strong></span>
    </div>
  </Transition>
</template>

<style scoped>
.offline-banner {
  border-bottom: 1px solid transparent;
  font-size: var(--font-size-xs);
  line-height: var(--line-height-tight);
}

.offline-banner.is-offline {
  border-bottom-color: color-mix(in srgb, var(--color-status-warning) 40%, transparent);
  color: var(--color-status-warning);
  background-color: color-mix(in srgb, var(--color-status-warning) 15%, var(--surface-bg));
}

.offline-banner.is-online {
  border-bottom-color: color-mix(in srgb, var(--color-status-success) 40%, transparent);
  color: var(--color-status-success);
  background-color: color-mix(in srgb, var(--color-status-success) 15%, var(--surface-bg));
}

.banner-fade-enter-active,
.banner-fade-leave-active {
  transition: opacity 0.2s ease-out;
}

.banner-fade-enter-from,
.banner-fade-leave-to {
  opacity: 0;
}
</style>
