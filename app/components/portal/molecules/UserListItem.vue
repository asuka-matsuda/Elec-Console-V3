<script setup lang="ts">
/**
 * UserListItem
 * [Portal Molecules] ユーザー一覧の1ユーザーカードアイテム。
 * 選択状態のハイライト、氏名、ログインID、権限バッジ、PWリセット要求バッジを提供します。
 */
import type { User } from '~/types/auth'

defineProps<{
  user: User
  isSelected?: boolean
}>()

const emit = defineEmits<{
  select: [user: User]
}>()
</script>

<template>
  <Panel
    interactive
    :selected="isSelected"
    class="p-3 w-full"
    @click="emit('select', user)"
  >
    <div class="flex items-center gap-2 min-w-0 mb-1">
      <span class="user-name">
        {{ user.lastName }} {{ user.firstName }}
      </span>
      <Badge :id="`role:${user.role}`" class="shrink-0" />
      <Badge v-if="user.requirePasswordReset" id="user:pwd-reset" class="shrink-0" />
    </div>

    <div class="user-id">
      ID: {{ user.loginId || user.id }}
    </div>
  </Panel>
</template>

<style scoped>
.user-name {
  overflow: hidden;

  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-main);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-id {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
