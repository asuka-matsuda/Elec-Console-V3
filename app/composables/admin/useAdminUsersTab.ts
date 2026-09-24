/**
 * ポータル管理 - ユーザー管理タブ（2ペインレイアウト）オーケストレーション Composable
 *
 * @description ユーザー一覧の選択状態同期、新規ユーザー登録モーダル、
 * ユーザー更新、削除確認ダイアログ、パスワード初期化フローを一元管理します。
 */

import { computed, onMounted, ref, watch } from 'vue'

import { useAdminSites } from '~/composables/admin/useAdminSites'
import { useAdminUsers } from '~/composables/admin/useAdminUsers'
import { useModal } from '~/composables/useModal'
import type { User, UserRole } from '~/types/auth'
import { parseToAppException } from '~/utils/errors'

export interface CreateUserFormState {
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

export const INITIAL_CREATE_USER: CreateUserFormState = {
  loginId: '',
  lastName: '',
  firstName: '',
  lastNameKana: '',
  firstNameKana: '',
  role: 'worker',
  requirePasswordReset: true,
  assignedSiteIds: [],
}

export function useAdminUsersTab() {
  const { users, fetchUsers, deleteUser, resetUserPassword, createUser, updateUser } = useAdminUsers()
  const { sites, fetchSites, isLoaded: isSitesLoaded } = useAdminSites()
  const { askConfirm } = useModal()

  onMounted(async () => {
    if (users.value.length === 0) {
      await fetchUsers()
    }
    if (!isSitesLoaded?.value) {
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
  const newUser = ref<CreateUserFormState>({ ...INITIAL_CREATE_USER })

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

  // --- 削除 & パスワード初期化 確認モーダル ---
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

  return {
    users,
    sites,
    selectedUserId,
    selectedUser,
    isSaving,
    handleSaveUser,
    isCredentialModalOpen,
    credentialTarget,
    isCreateModalOpen,
    isCreatingUser,
    createErrorMsg,
    newUser,
    openCreateModal,
    handleCreateUser,
    confirmDelete,
    confirmResetPassword,
  }
}
