<script setup lang="ts">
/**
 * TabAdminUsers
 * [Portal Organisms] ポータル管理 - ユーザー管理（PC管理コンソール型 2ペインレイアウト）
 * 左ペイン（ユーザー一覧・検索・新規登録）と右ペイン（ユーザー詳細設定）を常時展開します。
 */
import { computed, onMounted, ref, watch } from 'vue'

import type { SiteAssignment, User, UserRole } from '#shared/types/auth'
import { useAdminSites } from '~/composables/admin/useAdminSites'
import { useAdminUsers } from '~/composables/admin/useAdminUsers'
import { useModal } from '~/composables/useModal'
import {
  USER_CREATE_FORM_FIELDS,
  USER_ROLE_OPTIONS,
} from '~/constants/adminConstants'
import { parseToAppException } from '~/utils/errors'

interface CreateUserFormState {
  loginId: string
  lastName: string
  firstName: string
  lastNameKana: string
  firstNameKana: string
  role: UserRole
  requirePasswordReset: boolean
  assignedSiteIds: string[]
  siteAssignments?: SiteAssignment[]
  [key: string]: string | boolean | string[] | SiteAssignment[] | UserRole | undefined
}

const INITIAL_CREATE_USER: CreateUserFormState = {
  loginId: '',
  lastName: '',
  firstName: '',
  lastNameKana: '',
  firstNameKana: '',
  role: 'worker',
  requirePasswordReset: true,
  assignedSiteIds: [],
  siteAssignments: [],
}

const { users, fetchUsers, deleteUser, resetUserPassword, createUser, updateUser } = useAdminUsers()
const { sites, fetchSites, isLoaded: isSitesLoaded } = useAdminSites()
const { askConfirm } = useModal()

// --- 状態宣言（State） ---
const selectedUserId = ref<string | null>(null)
const isSaving = ref(false)
const isCredentialModalOpen = ref(false)
const credentialTarget = ref<(User & { initialPassword?: string, loginId?: string }) | null>(null)
const isCreateModalOpen = ref(false)
const isCreatingUser = ref(false)
const createErrorMsg = ref('')
const newUser = ref<CreateUserFormState>({ ...INITIAL_CREATE_USER })

// --- 派生状態（Computed） ---
const selectedUser = computed<User | null>(() => {
  if (!selectedUserId.value) return null

  return users.value.find(u => u.id === selectedUserId.value) || null
})

// --- 監視（Watch） ---
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

// --- ライフサイクル（Lifecycle） ---
onMounted(async () => {
  if (users.value.length === 0) {
    await fetchUsers()
  }
  if (!isSitesLoaded?.value) {
    await fetchSites()
  }
})

// --- アクションハンドラ（Actions） ---
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

const openCreateModal = () => {
  createErrorMsg.value = ''
  newUser.value = { ...INITIAL_CREATE_USER }
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
    <div class="flex flex-col lg:flex-row gap-section-gap items-start">

      <aside class="w-full lg:w-[340px] shrink-0">
        <PortalMasterUserList
          :users="users"
          :selected-user-id="selectedUserId"
          @select="selectedUserId = $event.id"
          @create="openCreateModal"
        />
      </aside>

      <Divider
        orientation="vertical"
        class="hidden lg:block self-stretch"
      />

      <section class="flex-1 min-w-0">
        <PortalDetailUserSettings
          :user="selectedUser"
          :site-list="sites"
          :is-saving="isSaving"
          @save="handleSaveUser"
          @reset-password="confirmResetPassword"
          @delete="confirmDelete"
        />
      </section>
    </div>

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

      <form class="flex flex-col gap-form-row-gap" @submit.prevent="handleCreateUser">
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
          <Select
            v-model="newUser.role"
            :options="USER_ROLE_OPTIONS"
            :clearable="false"
          />
        </FormGroup>
        <FormGroup>
          <Checkbox
            v-model="newUser.requirePasswordReset"
            label="初回ログイン時にパスワード変更を要求する"
          />
        </FormGroup>
      </form>
    </Modal>

    <PortalModalUserCredential
      v-model="isCredentialModalOpen"
      :user="credentialTarget"
    />
  </Panel>
</template>
