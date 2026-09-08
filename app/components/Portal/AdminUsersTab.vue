<script setup lang="ts">
/**
 * PortalAdminUsersTab
 * ポータル管理 - ユーザー管理タブ
 */
import { onMounted, ref } from 'vue'

import { useAdminUsers } from '~/composables/admin/useAdminUsers'
import type { User } from '~/types/auth'
import type { TableColumn } from '~/types/components'

const { users, fetchUsers, deleteUser, resetUserPassword } = useAdminUsers()

onMounted(() => {
  fetchUsers()
})

const userHeaders: TableColumn<User>[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'lastName', label: '名前', sortable: true },
  { key: 'loginId', label: 'ログインID', sortable: true },
  { key: 'role', label: '権限', sortable: true },
  { key: 'lastLoginAt', label: '最終ログイン', sortable: true },
  { key: 'actions', label: '操作' },
]

const {
  sortBy: sortKey,
  sortOrder,
  sortedData: sortedUsers,
  handleSort,
} = useTableSort(users, {
  defaultKey: 'id',
  defaultOrder: 'asc',
})

const formatLastLogin = (row: unknown) => {
  const user = row as User

  if (!user.lastLoginAt) return '未ログイン'

  return formatDateTime(user.lastLoginAt as string)
}

const isCreateModalOpen = ref(false)
const isCredentialModalOpen = ref(false)
const createdUserResult = ref<(User & { initialPassword?: string }) | null>(
  null,
)

const isAssignModalOpen = ref(false)
const assignTargetUserId = ref('')
const assignTargetSiteIds = ref<string[]>([])

const { askConfirm } = useModal()

const handleUserCreated = (user: User) => {
  createdUserResult.value = user
  isCredentialModalOpen.value = true
}

const handleOpenAssign = (row: User) => {
  assignTargetUserId.value = row.id
  assignTargetSiteIds.value = [...(row.assignedSiteIds || [])]
  isAssignModalOpen.value = true
}

const confirmDelete = async (row: User) => {
  if (row.id === 'master') {
    alert('マスターユーザーは削除できません。')

    return
  }
  const isConfirmed = await askConfirm({
    title: 'ユーザー削除',
    message: `ユーザー「${row.lastName || ''} ${row.firstName || ''}」を削除してもよろしいですか？`,
    confirmText: '削除する',
    intent: 'danger',
  })

  if (isConfirmed) {
    await deleteUser(row.id)
  }
}

const confirmResetPassword = async (row: User) => {
  const isConfirmed = await askConfirm({
    title: 'パスワード初期化',
    message: `ユーザー「${row.lastName || ''} ${row.firstName || ''}」のパスワードを強制的に初期化し、新しい初期パスワードを発行しますか？`,
    confirmText: '初期化する',
    intent: 'danger',
  })

  if (isConfirmed) {
    try {
      const newPassword = await resetUserPassword(row.id)

      createdUserResult.value = {
        ...row,
        initialPassword: newPassword,
      }
      isCredentialModalOpen.value = true
    }
    catch (e: unknown) {
      alert((e as Error).message)
    }
  }
}
</script>

<template>
  <AppPanel class="admin-users">
    <AppSectionHeader title="ユーザー一覧">
      <template #actions>
        <AppButton
          variant="primary"
          icon="plus"
          @click="isCreateModalOpen = true"
        >
          新規ユーザー登録
        </AppButton>
      </template>
    </AppSectionHeader>

    <AppTable
      :columns="userHeaders"
      :data="sortedUsers"
      :sort-by="sortKey"
      :sort-order="sortOrder"
      @sort="handleSort"
    >
      <template #cell-lastName="{ row }">
        {{ row.lastName }} {{ row.firstName }}
      </template>
      <template #cell-role="{ row }">
        <AppBadge
          :color="
            row.role === 'admin'
              ? 'var(--color-status-danger)'
              : row.role === 'worker'
                ? 'var(--color-status-success)'
                : 'var(--color-text-muted)'
          "
        >
          {{ row.role }}
        </AppBadge>
      </template>
      <template #cell-lastLoginAt="{ row }">
        <div class="admin-users__login-cell">
          <AppBadge
            v-if="row.requirePasswordReset"
            color="var(--color-status-danger)"
          >
            PWリセット要求
          </AppBadge>
          <span class="admin-users__meta">{{
            formatLastLogin(row)
          }}</span>
        </div>
      </template>
      <template #cell-actions="{ row }">
        <div class="admin-users__actions">
          <AppButton
            variant="secondary"
            size="sm"
            @click="handleOpenAssign(row)"
          >
            現場アサイン
          </AppButton>
          <AppButton
            variant="secondary"
            size="sm"
            @click="confirmResetPassword(row)"
          >
            PW初期化
          </AppButton>
          <AppButton
            variant="danger"
            size="sm"
            :disabled="row.id === 'master'"
            @click="confirmDelete(row)"
          >
            削除
          </AppButton>
        </div>
      </template>
    </AppTable>

    <UserCreateModal v-model="isCreateModalOpen" @success="handleUserCreated" />

    <UserCredentialModal
      v-model="isCredentialModalOpen"
      :user="createdUserResult"
    />

    <UserAssignModal
      v-model="isAssignModalOpen"
      :user-id="assignTargetUserId"
      :initial-site-ids="assignTargetSiteIds"
    />
  </AppPanel>
</template>

<style scoped lang="scss">
.admin-users {
  &__login-cell {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  &__actions {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }

  &__meta {
    font-size: var(--font-size-2xs);
    color: var(--color-text-muted);
  }
}
</style>
