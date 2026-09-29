<script setup lang="ts">
/**
 * ResultDrawer
 * [Tool Organism] モバイル用ボトムシートドロワー。
 * 下からコンテンツ（ResultPanel 等）を引き上げて表示する純粋なドロワー容器です。
 */
import { ref } from 'vue'

const isOpen = ref(false)
</script>

<template>
  <section
    class="result-drawer flex flex-col min-h-0 fixed inset-x-0 bottom-0 max-h-[80vh] z-modal"
    :class="{ 'is-open': isOpen }"
  >
    <button
      type="button"
      class="handle flex items-center justify-between w-full h-12 px-panel-pad-compact shrink-0"
      @click="isOpen = !isOpen"
    >
      <span>{{ isOpen ? '結果を閉じる' : '計算結果を見る' }}</span>
      <Icon
        :name="isOpen ? 'chevron-down' : 'chevron-up'"
        size="md"
      />
    </button>

    <div class="drawer-body flex flex-1 flex-col min-h-0 p-panel-pad-compact overflow-hidden">
      <slot />
    </div>
  </section>

  <div
    v-if="isOpen"
    class="overlay fixed inset-0 z-[calc(var(--z-index-modal)-1)]"
    @click="isOpen = false"
  />
</template>

<style scoped lang="scss">
.result-drawer {
  transform: translateY(calc(100% - 48px));

  border-top: var(--border-width-base) solid var(--color-category-tool);

  background: var(--surface-bg-solid, var(--color-main-bg));
  box-shadow: var(--shadow-elevation-md);

  transition: var(--transition-transform);

  &.is-open {
    transform: translateY(0);
  }

  .handle {
    border: none;

    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-tight);
    color: var(--color-category-tool);

    background: color-mix(
      in srgb,
      var(--color-category-tool) 10%,
      transparent
    );

    @include state-interactive;
  }
}

.overlay {
  background: var(--color-overlay-dark);
  backdrop-filter: blur(var(--blur-sm));
}
</style>
