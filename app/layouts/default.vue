<script setup lang="ts">
import { menuData } from '../utils/menuData'

// Mobile sidebar toggle state (Global)
const isSidebarOpen = useState('sidebar-open', () => false)

// Dynamic breadcrumbs based on current route
const breadcrumbs = useBreadcrumbs()
</script>

<template>
  <div class="l-app">
    <!-- Sidebar -->
    <AppSidebar 
      v-model:is-open="isSidebarOpen" 
      :menu-data="menuData" 
    />

    <!-- Main Content Area -->
    <div class="l-main">
      <AppHeader 
        :breadcrumbs="breadcrumbs"
        @toggle-sidebar="isSidebarOpen = !isSidebarOpen" 
      >
        <template #actions>
          <!-- User Profile / Actions -->
          <div class="l-header-user">
            <AppIcon name="bell" style="color: var(--color-text-secondary); width: 20px; height: 20px;" />
            <div class="l-header-user__avatar">
              <AppIcon name="user" style="width: 16px; height: 16px; color: var(--color-bg-base);" />
            </div>
            <span class="l-header-user__name">Admin</span>
          </div>
        </template>
      </AppHeader>

      <!-- Page Content -->
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
  min-height: 0;
}

.l-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; // Prevent flex item from blowing out

  // On desktop, the sidebar takes up 280px. We push the main content over.
  @include mq('lg', 'up-strict') {
    margin-left: 280px;
  }
}

.l-content {
  flex: 1;
  padding: var(--space-6);
  overflow-y: auto;
  @include custom-scrollbar();

  @include mq('md') {
    padding: var(--space-4);
  }
}

// Temporary user bar styles for demo
.l-header-user {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  font-family: var(--font-base);
  font-size: var(--text-sm);

  &__avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background-color: var(--color-category-main);
    border-radius: 50%;
    box-shadow: 0 0 12px theme-color(var(--color-category-main), 50%);
  }

  &__name {
    color: var(--color-text-main);
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.05em;
  }
}
</style>
