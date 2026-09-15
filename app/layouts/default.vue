<script setup lang="ts">
import { menuData } from '~/constants/data/menuData'

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
    <OrganismsGlobalNav v-model:is-open="isSidebarOpen" :menu-data="menuData" />

    <div class="flex flex-1 flex-col gap-0 min-w-0 main-container">
      <OrganismsHeader
        :breadcrumbs="breadcrumbs"
        @toggle-sidebar="isSidebarOpen = !isSidebarOpen"
      />

      <PortalAtomsOfflineBanner />

      <main class="flex flex-1 flex-col gap-0 min-h-0 overflow-y-auto p-layout-pad content-container">
        <slot />
        <OrganismsFooter />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.content-container {
  --scrollbar-size: var(--space-2);
}
</style>
