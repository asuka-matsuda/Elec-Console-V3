<script setup lang="ts">
import { menuData } from '~/constants/data/menuData'

// Mobile sidebar toggle state (Global)
const isSidebarOpen = useState('sidebar-open', () => false)

// Dynamic breadcrumbs based on current route
const { items: breadcrumbs, accent: breadcrumbAccent } = useBreadcrumbs()
const { currentUser, logout } = useAuth()
</script>

<template>
  <div
    class="l-app"
    :style="{ '--theme-accent': `var(--color-category-${breadcrumbAccent || 'main'})` }"
  >
    <!-- Sidebar -->
    <LayoutGlobalNav
      v-model:is-open="isSidebarOpen"
      :menu-data="menuData"
    />

    <!-- Main Content Area -->
    <div class="l-main">
      <LayoutHeader
        :breadcrumbs="breadcrumbs"
        @toggle-sidebar="isSidebarOpen = !isSidebarOpen"
      >
        <template #actions>
          <!-- User Profile / Actions -->
          <div class="l-header-user">
            <AppIcon
              name="bell"
              size="md"
              style="color: var(--color-text-secondary);"
            />
            <div class="l-header-user__avatar">
              <AppIcon
                name="user"
                size="sm"
                style="color: var(--color-main-bg);"
              />
            </div>
            <span class="l-header-user__name">{{ currentUser ? `${currentUser.lastName} ${currentUser.firstName}` : 'ゲスト' }}</span>
            <AppButton
              variant="secondary"
              size="sm"
              class="l-header-user__logout"
              @click="logout"
            >
              ログアウト
            </AppButton>
          </div>
        </template>
      </LayoutHeader>

      <!-- Page Content -->
      <main class="l-content">
        <slot />
        <LayoutFooter />
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
  @include flex-column(0);

  flex: 1;
  min-width: 0; /* Prevent flex item from blowing out */

  @include mq("md") {
    margin-left: 0;
  }
}

.l-content {
  --scrollbar-size: var(--space-2);

  container-type: inline-size;
  overflow-y: auto;

  @include flex-column(0);

  flex: 1;

  min-height: 0;
  padding: var(--space-layout-pad);
}

.l-header-user {
  @include text-title("sm");
  @include flex-start(var(--space-inline-gap));

  &__avatar {
    --glow-color: color-mix(in srgb, var(--theme-accent) 50%, transparent);

    @include flex-center;

    width: var(--size-control-sm);
    height: var(--size-control-sm);

    @include border-base(var(--theme-accent), $width: var(--border-width-thick));

    border-radius: 50%;
    background: var(--theme-accent);

    @include state-focus(var(--theme-accent));
  }

  &__name {
    color: var(--color-text-main);
  }
}
</style>
