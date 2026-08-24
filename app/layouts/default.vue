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
  // --- レイアウト・配置 ---
  display: flex;
  flex: 1;

  // --- ボックスモデル ---
  min-height: 0;
}

.l-main {
  // --- レイアウト・配置 ---
  @include flex-column(0);

  flex: 1;

  // --- ボックスモデル ---
  min-width: 0; /* Prevent flex item from blowing out */
  margin-left: 280px; /* On desktop, the sidebar takes up 280px. */

  @include mq("md") {
    // --- ボックスモデル ---
    margin-left: 0;
  }
}

.l-content {
  // --- CSSカスタムプロパティ ---

  --scrollbar-size: var(--size-2);


  // --- レイアウト・配置 ---

  container-type: inline-size;

  // --- その他 ---
  overflow-y: auto;


  // --- レイアウト・配置 ---

  @include flex-column(0);

  flex: 1;


  // --- ボックスモデル ---

  min-height: 0;
  padding: var(--pad-container);

  @include mq("md") {
    // --- ボックスモデル ---
    padding: var(--pad-section);
  }
}

/* Temporary user bar styles for demo */
.l-header-user {
  // --- 継承 ---

  @extend %text-sm;


  // --- レイアウト・配置 ---

  display: flex;
  gap: var(--gap-component);
  align-items: center;


  // --- 子要素 ---

  &__avatar {
    // --- CSSカスタムプロパティ ---
    --glow-color: theme-color(var(--color-category-main), 50%);


    // --- レイアウト・配置 ---

    display: flex;
    align-items: center;
    justify-content: center;


    // --- ボックスモデル ---

    width: var(--size-control-sm);
    height: var(--size-control-sm);
    border: var(--border-width-thick) solid var(--color-category-main);
    border-radius: 50%;


    // --- 視覚効果 ---

    background: var(--color-category-main);
    box-shadow: var(--shadow-glow-lg);
  }

  &__name {
    // --- タイポグラフィ ---
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }
}
</style>
