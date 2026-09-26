<script setup lang="ts">
/**
 * Header
 * [Organisms] アプリケーション全体のトップヘッダー。
 * ナビゲーション、ロゴ、パンくず、マイページ導線、ログアウトを配置。
 */
import { computed } from 'vue'

import { useSidebar } from '~/composables/useSidebar'
import type { HeaderProps } from '~/types/components'

defineProps<HeaderProps>()

const emit = defineEmits<{
  'toggle-sidebar': []
}>()

const { toggleSidebar } = useSidebar()
const { currentUser, logout } = useAuth()

const userName = computed(() => {
  if (!currentUser.value) return ''

  return `${currentUser.value.lastName} ${currentUser.value.firstName}`
})

const handleToggleSidebar = () => {
  toggleSidebar()
  emit('toggle-sidebar')
}
</script>

<template>
  <header class="flex h-16 items-center justify-between px-layout-pad header">

    <div class="flex items-center gap-item-gap">
      <Button
        icon="menu"
        icon-only
        title="メニューを開閉"
        @click="handleToggleSidebar"
      />
      <Logo />

      <Breadcrumb
        :items="breadcrumbs"
        class="max-md:hidden"
      />
    </div>

    <div class="flex items-center gap-item-gap">
      <NuxtLink
        to="/mypage"
        class="flex items-center gap-inline-gap"
      >
        <Icon
          name="user"
          size="sm"
        />
        <span class="max-md:hidden">
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
</style>
