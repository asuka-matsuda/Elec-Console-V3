<script setup lang="ts">
import { menuData } from '~/constants/data/menuData'

const isSidebarOpen = useState('sidebar-open', () => false)

const { items: breadcrumbs, accent: breadcrumbAccent } = useBreadcrumbs()
</script>

<template>
  <div
    class="l-app"
    :style="{
      '--theme-accent': `var(--color-category-${breadcrumbAccent || 'main'})`,
    }"
  >
    <AppGlobalNav v-model:is-open="isSidebarOpen" :menu-data="menuData" />

    <div class="l-main">
      <AppHeader
        :breadcrumbs="breadcrumbs"
        @toggle-sidebar="isSidebarOpen = !isSidebarOpen"
      >
        <template #actions>
          <AppHeaderUser />
        </template>
      </AppHeader>

      <main class="l-content">
        <slot />
        <AppFooter />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.l-app {
  display: flex;
  flex: 1;
  gap: 0;
  min-height: 0;
}

.l-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0;

  min-width: 0; /* Prevent flex item from blowing out */
}

.l-content {
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
