<script setup lang="ts">
/**
 * PortalAdminUsersTab
 * ポータル管理 - ユーザー管理タブ
 */
import { onMounted, ref } from 'vue'

import { useAdminUsers } from '~/composables/admin/useAdminUsers'
import { ADMIN_USER_COLUMNS } from '~/constants/adminConstants'
import type { User } from '~/types/auth'

const { users, fetchUsers, deleteUser, resetUserPassword } = useAdminUsers()

onMounted(() => {
  fetchUsers()
})

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
  <AtomsPanel class="admin-users">
    <MoleculesSectionHeader title="ユーザー一覧">
      <template #actions>
        <AtomsButton
          variant="primary"
          icon="plus"
          @click="isCreateModalOpen = true"
        >
          新規ユーザー登録
        </AtomsButton>
      </template>
    </MoleculesSectionHeader>

    <AppTable
      :columns="ADMIN_USER_COLUMNS"
      :data="sortedUsers"
      :sort-by="sortKey"
      :sort-order="sortOrder"
      @sort="handleSort"
    >
      <template #cell-lastName="{ row }">
        {{ row.lastName }} {{ row.firstName }}
      </template>
      <template #cell-role="{ row }">
        <AtomsBadge
          :color="
            row.role === 'admin'
              ? 'var(--color-status-danger)'
              : row.role === 'worker'
                ? 'var(--color-status-success)'
                : 'var(--color-text-muted)'
          "
        >
          {{ row.role }}
        </AtomsBadge>
      </template>
      <template #cell-lastLoginAt="{ row }">
        <div class="admin-users__login-cell">
          <AtomsBadge
            v-if="row.requirePasswordReset"
            color="var(--color-status-danger)"
          >
            PWリセット要求
          </AtomsBadge>
          <span class="admin-users__meta">{{
            formatLastLogin(row)
          }}</span>
        </div>
      </template>
      <template #cell-actions="{ row }">
        <div class="admin-users__actions">
          <AtomsButton
            variant="secondary"
            size="sm"
            @click="handleOpenAssign(row)"
          >
            現場アサイン
          </AtomsButton>
          <AtomsButton
            variant="secondary"
            size="sm"
            @click="confirmResetPassword(row)"
          >
            PW初期化
          </AtomsButton>
          <AtomsButton
            variant="danger"
            size="sm"
            :disabled="row.id === 'master'"
            @click="confirmDelete(row)"
          >
            削除
          </AtomsButton>
        </div>
      </template>
    </AppTable>

    <PortalUserCreateModal v-model="isCreateModalOpen" @success="handleUserCreated" />

    <PortalUserCredentialModal
      v-model="isCredentialModalOpen"
      :user="createdUserResult"
    />

    <PortalUserAssignModal
      v-model="isAssignModalOpen"
      :user-id="assignTargetUserId"
      :initial-site-ids="assignTargetSiteIds"
    />
  </AtomsPanel>
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
