<script setup lang="ts">
/**
 * PortalOrganismsAdminUsersTab
 * ポータル管理 - ユーザー管理（PC管理コンソール型 2ペインレイアウト）
 * 左ペイン（ユーザー一覧・検索・新規登録）と右ペイン（ユーザー詳細設定・基本情報・現場アサイン）を常時展開します。
 */
import { computed, onMounted, ref, watch } from 'vue'

import { useAdminSites } from '~/composables/admin/useAdminSites'
import { useAdminUsers } from '~/composables/admin/useAdminUsers'
import { useModal } from '~/composables/useModal'
import {
  USER_CREATE_FORM_FIELDS,
  USER_ROLE_OPTIONS,
} from '~/constants/adminConstants'
import type { Site } from '~/types/admin'
import type { User, UserRole } from '~/types/auth'
import { printUserCredential } from '~/utils/printUserCredential'

const { users, fetchUsers, deleteUser, resetUserPassword, createUser, updateUser } = useAdminUsers()
const { sites, fetchSites } = useAdminSites()

const siteList = computed<Site[]>(() => sites.value || [])

onMounted(() => {
  fetchUsers()
  fetchSites()
})

// --- 選択中のユーザー管理 ---
const selectedUserId = ref<string | null>(null)

// usersが読み込まれたら自動的に先頭を選択
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

const handleSelectUser = (user: User) => {
  selectedUserId.value = user.id
}

// --- ユーザー情報の保存 ---
const isSaving = ref(false)

const handleSaveUser = async (updates: Partial<User>) => {
  if (!selectedUser.value) return

  isSaving.value = true
  try {
    await updateUser(selectedUser.value.id, updates)
  }
  finally {
    isSaving.value = false
  }
}

// --- 新規登録モーダル ---
const isCreateModalOpen = ref(false)
const initialUserState = {
  id: '',
  lastName: '',
  firstName: '',
  lastNameKana: '',
  firstNameKana: '',
  role: 'worker' as UserRole,
  requirePasswordReset: true,
  assignedSiteIds: [] as string[],
}
const newUser = ref({ ...initialUserState })

const createErrorMsg = ref('')
const isCreatingUser = ref(false)

const openCreateModal = () => {
  createErrorMsg.value = ''
  newUser.value = { ...initialUserState }
  isCreateModalOpen.value = true
}

const handleCreateUser = async () => {
  createErrorMsg.value = ''
  if (!newUser.value.id || !newUser.value.lastName || !newUser.value.firstName) {
    createErrorMsg.value = 'ID、姓、名を入力してください。'

    return
  }

  try {
    isCreatingUser.value = true
    const result = await createUser(newUser.value)

    createdUserResult.value = result
    selectedUserId.value = result.id
    isCreateModalOpen.value = false
    isCredentialModalOpen.value = true
  }
  catch (e: unknown) {
    createErrorMsg.value = (e as Error).message || 'ユーザーの登録に失敗しました。'
  }
  finally {
    isCreatingUser.value = false
  }
}

// --- 認証情報モーダル（新規作成後 & PW初期化後） ---
const isCredentialModalOpen = ref(false)
const createdUserResult = ref<(User & { initialPassword?: string, loginId?: string }) | null>(null)

const handleCopyPassword = () => {
  if (createdUserResult.value?.initialPassword) {
    navigator.clipboard.writeText(createdUserResult.value.initialPassword)
    alert('初期パスワードをコピーしました。')
  }
}

const handlePrint = () => {
  if (createdUserResult.value) {
    printUserCredential({
      lastName: createdUserResult.value.lastName,
      firstName: createdUserResult.value.firstName,
      loginId: createdUserResult.value.loginId || createdUserResult.value.id,
      initialPassword: createdUserResult.value.initialPassword,
    })
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
  <Panel>
    <div class="flex flex-col lg:flex-row gap-6 items-start">
      <!-- 左ペイン: Master (幅約340px) -->
      <div class="w-full lg:w-[340px] shrink-0">
        <PortalOrganismsUserListMaster
          :users="users"
          :selected-user-id="selectedUserId"
          @select="handleSelectUser"
          @create="openCreateModal"
        />
      </div>

      <div class="pane-divider hidden lg:block w-px self-stretch" />

      <!-- 右ペイン: Detail (残りワイド領域) -->
      <div class="flex-1 min-w-0 w-full">
        <PortalOrganismsUserSettingsDetail
          :user="selectedUser"
          :site-list="siteList"
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
        <div
          v-if="createErrorMsg"
          class="p-2.5 form-error"
        >
          {{ createErrorMsg }}
        </div>

        <template v-for="field in USER_CREATE_FORM_FIELDS" :key="field.id">
          <FormGroup :label="field.label">
            <Input
              v-model="newUser[field.id]"
              :placeholder="field.placeholder"
            />
          </FormGroup>
        </template>

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

    <!-- 認証情報発行完了モーダル (中央ダイアログ) -->
    <Modal
      v-model="isCredentialModalOpen"
      title="認証情報の発行完了"
      icon="check-circle"
      @cancel="isCredentialModalOpen = false"
    >
      <template #actions>
        <Button
          variant="success"
          @click="isCredentialModalOpen = false"
        >
          完了
        </Button>
      </template>

      <div class="flex flex-col gap-4">
        <p class="credential-desc">
          以下のログイン情報を作業者へお伝えください。<br />
          （初期パスワードはこの画面を閉じると二度と表示されません）
        </p>

        <Panel v-if="createdUserResult" class="flex flex-col gap-3">
          <FormGroup label="氏名">
            <div class="user-value">
              {{ createdUserResult.lastName }} {{ createdUserResult.firstName }}
            </div>
          </FormGroup>
          <FormGroup label="ログインID">
            <div class="user-value is-mono">
              {{ createdUserResult.loginId || createdUserResult.id }}
            </div>
          </FormGroup>
          <FormGroup label="初期パスワード">
            <div class="flex items-center gap-2">
              <div class="user-value is-mono is-success flex-1">
                {{ createdUserResult.initialPassword || "（既に設定済みです）" }}
              </div>
              <Button
                v-if="createdUserResult.initialPassword"
                icon="copy"
                size="sm"
                @click="handleCopyPassword"
              >
                コピー
              </Button>
            </div>
          </FormGroup>
        </Panel>

        <div class="flex justify-end pt-1">
          <Button
            icon="printer"
            @click="handlePrint"
          >
            認証情報を印刷する
          </Button>
        </div>
      </div>
    </Modal>
  </Panel>
</template>

<style scoped lang="scss">
.pane-divider {
  background: var(--color-border);
}

.credential-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.user-value {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-main);

  &.is-mono {
    font-family: var(--font-mono);
  }

  &.is-success {
    color: var(--color-status-success);
  }
}

.form-error {
  border: var(--border-width-base) solid var(--color-status-danger);
  font-size: var(--font-size-xs);
  color: var(--color-status-danger);
  background-color: color-mix(in srgb, var(--color-status-danger) 10%, transparent);
}
</style>
