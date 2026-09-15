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
    class="user-item !p-3 flex items-center justify-between gap-3"
    @click="emit('select', user)"
  >
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1">
        <span class="user-name">
          {{ user.lastName }} {{ user.firstName }}
        </span>
        <AtomsBadge
          :color="
            user.role === 'admin'
              ? 'var(--color-status-danger)'
              : user.role === 'worker'
                ? 'var(--color-status-success)'
                : 'var(--color-text-muted)'
          "
        >
          {{ user.role === 'admin' ? '管理者' : user.role === 'worker' ? '作業員' : user.role }}
        </AtomsBadge>
        <AtomsBadge v-if="user.requirePasswordReset" color="var(--color-status-danger)">
          PWリセット要求
        </AtomsBadge>
      </div>
      <div class="user-id">
        ID: {{ user.loginId || user.id }}
      </div>
    </div>
  </AtomsPanel>
</template>

<style scoped lang="scss">
.user-item {
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
