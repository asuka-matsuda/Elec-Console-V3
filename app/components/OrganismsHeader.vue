<script setup lang="ts">
/**
 * OrganismsHeader
 * [Organisms] アプリケーション全体のトップヘッダー。
 * サイドバー開閉トグル、ロゴ、パンくずリスト、ログインユーザー情報、ログアウト操作を一元管理する独立セクション。
 */
import type { BreadcrumbItem } from '~/types/components'

interface Props {
  breadcrumbs?: BreadcrumbItem[]
}

defineProps<Props>()

const emit = defineEmits<{
  'toggle-sidebar': []
}>()

const { currentUser, logout } = useAuth()
</script>

<template>
  <header class="relative z-10 flex h-16 items-center justify-between px-[var(--space-layout-pad)] header">
    <!-- 左側: メインナビゲーション部 -->
    <div class="flex items-center gap-3">
      <Button
        icon="menu"
        icon-only
        title="メニューを開閉"
        @click="emit('toggle-sidebar')"
      />
      <AtomsLogo />

      <Breadcrumb
        v-if="breadcrumbs?.length"
        :items="breadcrumbs"
        class="max-md:hidden"
      />
    </div>

    <!-- 右側: アクション & ユーザー情報部 -->
    <div class="flex items-center gap-3">
      <slot name="actions" />

      <div class="flex items-center gap-2">
        <div class="flex shrink-0 items-center justify-center w-8 h-8 avatar">
          <Icon
            name="user"
            size="sm"
            class="avatar__icon"
          />
        </div>
        <span class="max-md:hidden user-name">
          {{ currentUser ? `${currentUser.lastName} ${currentUser.firstName}` : 'ゲスト' }}
        </span>
        <Button
          @click="logout"
        >
          ログアウト
        </Button>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.header {
  border-bottom: var(--border-width-base) solid var(--color-border);
  background-color: var(--surface-bg);
  backdrop-filter: blur(var(--blur-md));
}

.avatar {
  border: var(--border-width-base) solid color-mix(in srgb, var(--theme-accent) 40%, var(--color-border));
  border-radius: var(--radius-circle);
  box-shadow: var(--shadow-elevation-sm);
  transition: var(--transition-interactive);

  &__icon {
    color: var(--theme-accent);
  }

  &:hover {
    border-color: var(--theme-accent);
    box-shadow: var(--shadow-glow-sm);
  }
}

.user-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text-main);
}
</style>
