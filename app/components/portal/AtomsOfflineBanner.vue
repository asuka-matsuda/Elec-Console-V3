<script setup lang="ts">
/**
 * AtomsOfflineBanner
 * 現場の電波状況（圏外 / オンライン復帰）を監視し、
 * 作業員にデータのローカル保護状況を通知するHUDスタイルバナー。
 */
import { useOnline } from '@vueuse/core'
import { ref, watch } from 'vue'

const isOnline = useOnline()
const showBackOnline = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

watch(isOnline, (online, wasOnline) => {
  if (online && wasOnline === false) {
    showBackOnline.value = true

    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      showBackOnline.value = false
    }, 4000)
  }
})
</script>

<template>
  <Transition name="banner-slide">
    <div
      v-if="!isOnline"
      class="offline-banner offline w-full z-header flex items-center justify-center gap-2 py-1 px-4 text-center"
    >
      <AtomsIcon name="wifi-off" class="w-4 h-4 text-warning" />
      <span class="banner-text">
        <strong>圏外（オフライン）</strong>で動作中 — 入力データは端末内に保護され、電波復帰時に安全に同期できます
      </span>
    </div>

    <div
      v-else-if="showBackOnline"
      class="offline-banner online w-full z-header flex items-center justify-center gap-2 py-1 px-4 text-center"
    >
      <AtomsIcon name="wifi" class="w-4 h-4 text-success" />
      <span class="banner-text">
        <strong>オンラインに復帰しました</strong>
      </span>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.offline-banner {
  border-bottom: 1px solid transparent;
  font-size: var(--font-size-xs);
  line-height: var(--line-height-tight);

  &.offline {
    border-bottom-color: color-mix(in srgb, var(--color-status-warning) 40%, transparent);
    color: var(--color-status-warning);
    background-color: color-mix(in srgb, var(--color-status-warning) 15%, var(--color-bg-base));
  }

  &.online {
    border-bottom-color: color-mix(in srgb, var(--color-status-success) 40%, transparent);
    color: var(--color-status-success);
    background-color: color-mix(in srgb, var(--color-status-success) 15%, var(--color-bg-base));
  }
}

.banner-slide-enter-active,
.banner-slide-leave-active {
  transition: all 0.25s ease-out;
}

.banner-slide-enter-from,
.banner-slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
