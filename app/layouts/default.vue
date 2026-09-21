<script setup lang="ts">
const isSidebarOpen = useState('sidebar-open', () => false)
const { items: breadcrumbs, accent: breadcrumbAccent } = useBreadcrumbs()
</script>

<template>
  <div
    class="flex flex-1 gap-0 min-h-0 app-root"
    :style="{
      '--theme-accent': `var(--color-category-${breadcrumbAccent || 'main'})`,
    }"
  >
    <GlobalNav v-model:is-open="isSidebarOpen" />

    <div class="flex flex-1 flex-col gap-0 min-w-0 main-container">
      <Header
        :breadcrumbs="breadcrumbs"
        @toggle-sidebar="isSidebarOpen = !isSidebarOpen"
      />

      <OfflineBanner />

      <main class="flex flex-1 flex-col gap-0 min-h-0 overflow-y-auto p-layout-pad content-container">
        <slot />
        <Footer />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.content-container {
  --scrollbar-size: var(--space-2);
}
</style>
