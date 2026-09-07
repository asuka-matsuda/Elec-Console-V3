<script setup lang="ts">
/**
 * AppHeaderUser
 * ヘッダーに表示されるユーザー情報、アバター、通知アイコン、ログアウトアクションのコンポーネントです。
 */
const { currentUser, logout } = useAuth()
</script>

<template>
  <div class="header-user">
    <div class="avatar" aria-hidden="true">
      <AppIcon
        name="user"
        size="sm"
        style="color: var(--color-main-bg)"
      />
    </div>
    <span class="name">
      {{
        currentUser
          ? `${currentUser.lastName} ${currentUser.firstName}`
          : "ゲスト"
      }}
    </span>
    <AppButton
      variant="secondary"
      size="sm"
      @click="logout"
    >
      ログアウト
    </AppButton>
  </div>
</template>

<style scoped lang="scss">
.header-user {
  display: flex;
  gap: var(--space-2);
  align-items: center;

  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;

  width: var(--size-control-sm);
  height: var(--size-control-sm);
  border: var(--border-width-base) solid color-mix(in srgb, var(--theme-accent) 80%, transparent);
  border-radius: 50%;

  color: var(--color-main-bg);

  background: var(--theme-accent);
  box-shadow: var(--shadow-elevation-sm);
}

.name {
  color: var(--color-text-main);

  @include mq("md") {
    display: none;
  }
}
</style>
