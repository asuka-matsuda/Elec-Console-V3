<script setup lang="ts">
import { menuData } from '~/constants/data/menuData'

const isSidebarOpen = useState('sidebar-open', () => false)

const { items: breadcrumbs, accent: breadcrumbAccent } = useBreadcrumbs()
const { currentUser, logout } = useAuth()
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
          <div class="c-header-user">
            <AppIcon
              name="bell"
              size="md"
              style="color: var(--color-text-secondary)"
            />
            <div class="c-header-user__avatar">
              <AppIcon
                name="user"
                size="sm"
                style="color: var(--color-main-bg)"
              />
            </div>
            <span class="c-header-user__name">{{
              currentUser
                ? `${currentUser.lastName} ${currentUser.firstName}`
                : "ゲスト"
            }}</span>
            <AppButton
              variant="secondary"
              size="sm"
              @click="logout"
            >
              ログアウト
            </AppButton>
          </div>
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

.c-header-user {
  display: flex;
  gap: var(--space-2);
  align-items: center;

  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);

  &__avatar {
    --glow-color: color-mix(in srgb, var(--theme-accent) 50%, transparent);

    display: flex;
    align-items: center;
    justify-content: center;

    width: var(--size-control-sm);
    height: var(--size-control-sm);
    border: var(--border-width-thick) solid var(--theme-accent);
    border-color: color-mix(in srgb, var(--theme-accent) 60%, transparent);
    border-radius: 50%;
    border-radius: var(--radius-sm);

    background: var(--theme-accent);
    outline: none;
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--theme-accent) 70%, transparent),
      0 0 6px color-mix(in srgb, var(--theme-accent) 50%, transparent),
      0 0 12px color-mix(in srgb, var(--theme-accent) 20%, transparent);

    transition: var(--transition-glow);
  }

  &__name {
    color: var(--color-text-main);

    @include mq("md") {
      display: none;
    }
  }
}
</style>
