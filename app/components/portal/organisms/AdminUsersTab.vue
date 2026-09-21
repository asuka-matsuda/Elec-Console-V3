<script setup lang="ts">
/**
 * AdminUsersTab
 * [Portal Organisms] ポータル管理 - ユーザー管理（PC管理コンソール型 2ペインレイアウト）
 * 左ペイン（ユーザー一覧・検索・新規登録）と右ペイン（ユーザー詳細設定）を常時展開します。
 */
import { computed, onMounted, ref, watch } from 'vue'

import { useAdminSites } from '~/composables/admin/useAdminSites'
import { useAdminUsers } from '~/composables/admin/useAdminUsers'
import { useModal } from '~/composables/useModal'
import {
  USER_CREATE_FORM_FIELDS,
  USER_ROLE_OPTIONS,
} from '~/constants/adminConstants'
import type { User, UserRole } from '~/types/auth'
import { parseToAppException } from '~/utils/errors'

const { users, fetchUsers, deleteUser, resetUserPassword, createUser, updateUser } = useAdminUsers()
const { sites, fetchSites } = useAdminSites()

onMounted(async () => {
  if (users.value.length === 0) {
    await fetchUsers()
  }
  if (sites.value.length === 0) {
    await fetchSites()
  }
})

// --- 選択中のユーザー管理 ---
const selectedUserId = ref<string | null>(null)

watch(
  users,
  (loadedUsers) => {
    if (loadedUsers.length > 0) {
      if (!selectedUserId.value || !loadedUsers.some(u => u.id === selectedUserId.value)) {
        selectedUserId.value = loadedUsers[0]?.id || null
      }
    }
    else {
      selectedUserId.value = null
    }
  },
  { immediate: true },
)

const selectedUser = computed<User | null>(() => {
  if (!selectedUserId.value) return null

  return users.value.find(u => u.id === selectedUserId.value) || null
})

// --- ユーザー情報の保存 ---
const isSaving = ref(false)

const handleSaveUser = async (updates: Partial<User>) => {
  if (!selectedUser.value) return

  isSaving.value = true
  try {
    await updateUser(selectedUser.value.id, updates)
  }
  catch (e: unknown) {
    const appErr = parseToAppException(e)

    alert(appErr.getUserFacingMessage())
  }
  finally {
    isSaving.value = false
  }
}

// --- 認証情報モーダル表示状態（新規登録後 / PWリセット後 共通） ---
const isCredentialModalOpen = ref(false)
const credentialTarget = ref<(User & { initialPassword?: string, loginId?: string }) | null>(null)

// --- 新規登録モーダル ---
const isCreateModalOpen = ref(false)
const isCreatingUser = ref(false)
const createErrorMsg = ref('')

interface CreateUserFormState {
  loginId: string
  lastName: string
  firstName: string
  lastNameKana: string
  firstNameKana: string
  role: UserRole
  requirePasswordReset: boolean
  assignedSiteIds: string[]
  [key: string]: string | boolean | string[] | UserRole
}

const INITIAL_USER: CreateUserFormState = {
  loginId: '',
  lastName: '',
  firstName: '',
  lastNameKana: '',
  firstNameKana: '',
  role: 'worker',
  requirePasswordReset: true,
  assignedSiteIds: [],
}

const newUser = ref<CreateUserFormState>({ ...INITIAL_USER })

const openCreateModal = () => {
  createErrorMsg.value = ''
  newUser.value = { ...INITIAL_USER }
  isCreateModalOpen.value = true
}

const handleCreateUser = async () => {
  createErrorMsg.value = ''
  const loginId = newUser.value.loginId.trim()
  const lastName = newUser.value.lastName.trim()
  const firstName = newUser.value.firstName.trim()

  if (!loginId || !lastName || !firstName) {
    createErrorMsg.value = 'ログインID、姓、名を入力してください。'

    return
  }

  try {
    isCreatingUser.value = true
    const result = await createUser({
      ...newUser.value,
      id: loginId,
      loginId,
      lastName,
      firstName,
    })

    credentialTarget.value = result
    selectedUserId.value = result.id
    isCreateModalOpen.value = false
    isCredentialModalOpen.value = true
  }
  catch (e: unknown) {
    const appErr = parseToAppException(e)

    createErrorMsg.value = appErr.getUserFacingMessage()
  }
  finally {
    isCreatingUser.value = false
  }
}

// --- 削除 & パスワード初期化 確認モーダル ---
const { askConfirm } = useModal()

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
    try {
      await deleteUser(row.id)
    }
    catch (e: unknown) {
      const appErr = parseToAppException(e)

      alert(appErr.getUserFacingMessage())
    }
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

      credentialTarget.value = {
        ...row,
        initialPassword: newPassword,
      }
      isCredentialModalOpen.value = true
    }
    catch (e: unknown) {
      const appErr = parseToAppException(e)

      alert(appErr.getUserFacingMessage())
    }
  }
}
</script>

<template>
  <Panel>
    <div class="flex flex-col lg:flex-row gap-6 items-start">
      <!-- 左ペイン: Master (幅約340px) -->
      <div class="w-full lg:w-[340px] shrink-0">
        <PortalUserListMaster
          :users="users"
          :selected-user-id="selectedUserId"
          @select="selectedUserId = $event.id"
          @create="openCreateModal"
        />
      </div>

      <Divider
        orientation="vertical"
        class="hidden lg:block self-stretch"
      />

      <!-- 右ペイン: Detail (残りワイド領域) -->
      <div class="flex-1 min-w-0 w-full">
        <PortalUserSettingsDetail
          :user="selectedUser"
          :site-list="sites"
          :is-saving="isSaving"
          @save="handleSaveUser"
          @reset-password="confirmResetPassword"
          @delete="confirmDelete"
        />
      </div>
    </div>

    <!-- 新規登録モーダル (中央ダイアログ) -->
    <Modal
      v-model="isCreateModalOpen"
      title="新規ユーザー登録"
      icon="plus-circle"
    >
      <template #actions>
        <Button @click="isCreateModalOpen = false">
          キャンセル
        </Button>
        <Button
          variant="success"
          :loading="isCreatingUser"
          @click="handleCreateUser"
        >
          登録する
        </Button>
      </template>

      <div class="flex flex-col gap-4">
        <Alert
          v-if="createErrorMsg"
          variant="danger"
        >
          {{ createErrorMsg }}
        </Alert>

        <FormGroup
          v-for="field in USER_CREATE_FORM_FIELDS"
          :key="field.id"
          :label="field.label"
        >
          <Input
            v-model="newUser[field.id]"
            :placeholder="field.placeholder"
          />
        </FormGroup>

        <FormGroup label="権限">
          <Select v-model="newUser.role" :options="USER_ROLE_OPTIONS" />
        </FormGroup>
        <FormGroup>
          <Checkbox
            v-model="newUser.requirePasswordReset"
            label="初回ログイン時にパスワード変更を要求する"
          />
        </FormGroup>
      </div>
    </Modal>

    <!-- 認証情報発行完了モーダル（切り出し後） -->
    <PortalUserCredentialModal
      v-model="isCredentialModalOpen"
      :user="credentialTarget"
    />
  </Panel>
</template>
