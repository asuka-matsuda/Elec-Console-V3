<script setup lang="ts">
/**
 * MoleculesUserListItem
 * [Portal Molecules] ユーザー一覧の1ユーザーカード/アイテム。
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
  <AtomsPanel
    as="div"
    interactive
    :selected="isSelected"
    class="user-item flex items-center justify-between gap-3"
    @click="emit('select', user)"
  >
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1">
        <span class="user-name">
          {{ user.lastName }} {{ user.firstName }}
        </span>
        <Badge :id="`role:${user.role}`" />
        <Badge v-if="user.requirePasswordReset" id="user:pwd-reset" />
      </div>
      <div class="user-id">
        ID: {{ user.loginId || user.id }}
      </div>
    </div>
  </AtomsPanel>
</template>

<style scoped lang="scss">
.user-item {
  padding: var(--space-3);

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
}
</style>
