<script setup lang="ts">
import { menuData } from '~/constants/data/menuData'

const isSidebarOpen = useState('sidebar-open', () => false)

const { items: breadcrumbs, accent: breadcrumbAccent } = useBreadcrumbs()
</script>

<template>
  <div
    class="app-root"
    :style="{
      '--theme-accent': `var(--color-category-${breadcrumbAccent || 'main'})`,
    }"
  >
    <OrganismsGlobalNav v-model:is-open="isSidebarOpen" :menu-data="menuData" />

    <div class="main-container">
      <OrganismsHeader
        :breadcrumbs="breadcrumbs"
        @toggle-sidebar="isSidebarOpen = !isSidebarOpen"
      />

      <main class="content-container">
        <slot />
        <OrganismsFooter />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-root {
  display: flex;
  flex: 1;
  gap: 0;
  min-height: 0;
}

.main-container {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0;

  min-width: 0; /* Prevent flex item from blowing out */
}

.content-container {
  --scrollbar-size: var(--space-2);

  overflow-y: auto;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0;

  min-height: 0;
  padding: var(--space-layout-pad);
}
</style>
