<script setup lang="ts">
/**
 * デフォルトレイアウト
 *
 * グローバルナビゲーション、ヘッダー、オフライン警告バナー、フッター、
 * およびパンくず連動のカテゴリアクセントカラーを提供します。
 */
const { accent } = useBreadcrumbs()
const { isOpen: isSidebarOpen } = useSidebar()
</script>

<template>
  <div
    class="flex flex-1 flex-col min-h-0 min-w-0"
    :style="{ '--theme-accent': `var(--color-category-${accent || 'main'})` }"
  >
    <GlobalNav v-model:is-open="isSidebarOpen" />
    <Header />
    <OfflineBanner />

    <main class="flex flex-1 flex-col min-h-0 overflow-y-auto p-layout-pad [--scrollbar-size:var(--space-2)]">
      <slot />
      <Footer />
    </main>
  </div>
</template>
