<script setup lang="ts">
/**
 * Header
 * [Organisms] アプリケーション全体のトップヘッダー。
 * ナビゲーション、ロゴ、パンくず、マイページ導線、ログアウトを配置。
 */
import { computed } from 'vue'

import type { HeaderProps } from '~/types/components'

defineProps<HeaderProps>()

const emit = defineEmits<{
  'toggle-sidebar': []
}>()

const { currentUser, logout } = useAuth()

const userName = computed(() => {
  if (!currentUser.value) return ''

  return `${currentUser.value.lastName} ${currentUser.value.firstName}`
})
</script>

<template>
  <header class="flex h-16 items-center justify-between px-layout-pad header">

    <div class="flex items-center gap-3">
      <Button
        icon="menu"
        icon-only
        title="メニューを開閉"
        @click="emit('toggle-sidebar')"
      />
      <Logo />

      <Breadcrumb
        :items="breadcrumbs"
        class="max-md:hidden"
      />
    </div>

    <div class="flex items-center gap-3">
      <NuxtLink
        to="/mypage"
        class="flex items-center gap-2 user-link"
      >
        <div class="flex shrink-0 items-center justify-center w-8 h-8 avatar">
          <Icon
            name="user"
            size="sm"
            class="avatar__icon"
          />
        </div>
        <span class="max-md:hidden user-name">
          {{ userName }}
        </span>
      </NuxtLink>

      <Button
        @click="logout"
      >
        ログアウト
      </Button>
    </div>
  </header>
</template>

<style scoped lang="scss">
.header {
  border-bottom: var(--border-width-base) solid var(--color-border);
  background-color: var(--surface-bg);
}

.user-link {
  cursor: pointer;
  color: inherit;
  text-decoration: none;

  &:hover {
    .avatar {
      border-color: var(--theme-accent);
    }

    .user-name {
      color: var(--theme-accent);
    }
  }
}

.avatar {
  border: var(--border-width-base) solid var(--color-border);
  border-radius: var(--radius-circle);
  transition: var(--transition-base);

  &__icon {
    color: var(--theme-accent);
  }
}

.user-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-main);
  transition: var(--transition-base);
}
</style>
