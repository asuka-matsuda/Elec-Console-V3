<script setup lang="ts">
import { menuData } from "~/utils/data/menuData";

// Mobile sidebar toggle state (Global)
const isSidebarOpen = useState("sidebar-open", () => false);

// Dynamic breadcrumbs based on current route
const breadcrumbs = useBreadcrumbs();
</script>

<template>
  <div class="l-app">
    <!-- Sidebar -->
    <AppGlobalNav v-model:is-open="isSidebarOpen" :menu-data="menuData" />

    <!-- Main Content Area -->
    <div class="l-main">
      <AppHeader
        :breadcrumbs="breadcrumbs"
        @toggle-sidebar="isSidebarOpen = !isSidebarOpen"
      >
        <template #actions>
          <!-- User Profile / Actions -->
          <div class="l-header-user">
            <AppIcon
              name="bell"
              style="
                width: var(--icon-size-md);
                height: var(--icon-size-md);
                color: var(--color-text-secondary);
              "
            />
            <div class="l-header-user__avatar">
              <AppIcon
                name="user"
                style="
                  width: var(--icon-size-sm);
                  height: var(--icon-size-sm);
                  color: var(--color-bg-base);
                "
              />
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
  display: flex;
  flex: 1;
  flex-direction: column;

  min-width: 0; /* Prevent flex item from blowing out */
  margin-left: 280px; /* On desktop, the sidebar takes up 280px. */

  @include mq("md") {
    margin-left: 0;
  }
}

.l-content {

  --scrollbar-size: var(--size-2);

  container-type: inline-size;
  overflow-y: auto;
  display: flex;
  flex: 1;
  flex-direction: column;

  min-height: 0;
  padding: var(--pad-container);

  @include mq("md") {
    padding: var(--pad-section);
  }
}

/* Temporary user bar styles for demo */
.l-header-user {

  @extend %text-sm;

  display: flex;
  gap: var(--gap-component);
  align-items: center;

  &__avatar {
    display: flex;
    align-items: center;
    justify-content: center;

    width: var(--size-control-sm);
    height: var(--size-control-sm);
    border: var(--border-width-thick) solid var(--color-category-main);
    border-radius: 50%;

    background: var(--color-category-main);
    box-shadow: 0 0 var(--blur-lg) theme-color(var(--color-category-main), 50%);
  }

  &__name {
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
    letter-spacing: 0.05em;
  }
}
</style>
