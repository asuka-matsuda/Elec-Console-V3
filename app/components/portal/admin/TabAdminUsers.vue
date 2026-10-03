<script setup lang="ts">
/**
 * TabAdminUsers
 * [Portal Organisms] ポータル管理 - ユーザー管理（PC管理コンソール型 2ペインレイアウト）
 * 左ペイン（ユーザー一覧・検索・新規登録）と右ペイン（ユーザー詳細設定・現場アサイン・パスワード初期化）を1ファイルに統合。
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'

import type { SiteAssignment, User, UserRole } from '#shared/types/auth'
import { useAdminSites } from '~/composables/admin/useAdminSites'
import { useAdminUsers } from '~/composables/admin/useAdminUsers'
import { useModal } from '~/composables/useModal'
import {
  USER_CREATE_FORM_FIELDS,
  USER_ROLE_CONFIG,
  USER_ROLE_OPTIONS,
  USER_SETTINGS_TABS,
} from '~/constants/adminConstants'
import { formatDateTime } from '~/utils/date'
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

// --- 左ペイン（検索） ---
const searchQuery = ref('')

const filteredUsers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return users.value
  }

  return users.value.filter((u) => {
    const searchTarget = `${u.lastName || ''}${u.firstName || ''} ${u.lastNameKana || ''}${u.firstNameKana || ''} ${u.loginId || u.id || ''}`.toLowerCase()

    return searchTarget.includes(query)
  })
})

// --- 右ペイン（詳細設定） ---
const selectedUser = computed<User | null>(() => {
  if (!selectedUserId.value) return null

  return users.value.find(u => u.id === selectedUserId.value) || null
})

const activeCategory = ref('basic')

const form = reactive({
  lastName: '',
  firstName: '',
  lastNameKana: '',
  firstNameKana: '',
  role: 'worker' as UserRole,
  requirePasswordReset: false,
  assignedSiteIds: [] as string[],
  siteAssignments: [] as SiteAssignment[],
})

const lastLoginText = computed(() => {
  return selectedUser.value?.lastLoginAt ? formatDateTime(selectedUser.value.lastLoginAt) : '未ログイン'
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

watch(
  selectedUser,
  (newUserVal) => {
    if (newUserVal) {
      form.lastName = newUserVal.lastName || ''
      form.firstName = newUserVal.firstName || ''
      form.lastNameKana = newUserVal.lastNameKana || ''
      form.firstNameKana = newUserVal.firstNameKana || ''
      form.role = newUserVal.role || 'worker'
      form.requirePasswordReset = !!newUserVal.requirePasswordReset
      form.assignedSiteIds = [...(newUserVal.assignedSiteIds || [])]
      form.siteAssignments = newUserVal.siteAssignments
        ? newUserVal.siteAssignments.map(sa => ({ ...sa }))
        : (newUserVal.assignedSiteIds || []).map(id => ({ siteId: id, role: newUserVal.role || 'worker' }))
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

// --- サイトアサイン関連ヘルパー ---
const isSiteAssigned = (siteId: string) => {
  return form.assignedSiteIds.includes(siteId)
}

const getSiteRole = (siteId: string): UserRole => {
  const found = form.siteAssignments.find(sa => sa.siteId === siteId)

  return found?.role || form.role || 'worker'
}

const handleToggleSite = (siteId: string, assigned: unknown) => {
  const isChecked = !assigned

  if (isChecked) {
    if (!form.assignedSiteIds.includes(siteId)) {
      form.assignedSiteIds.push(siteId)
    }
    if (!form.siteAssignments.some(sa => sa.siteId === siteId)) {
      form.siteAssignments.push({ siteId, role: form.role || 'worker' })
    }
  }
  else {
    form.assignedSiteIds = form.assignedSiteIds.filter(id => id !== siteId)
    form.siteAssignments = form.siteAssignments.filter(sa => sa.siteId !== siteId)
  }
}

const handleSiteRoleChange = (siteId: string, newRole: unknown) => {
  const role = newRole as UserRole
  const found = form.siteAssignments.find(sa => sa.siteId === siteId)

  if (found) {
    found.role = role
  }
  else {
    form.siteAssignments.push({ siteId, role })
  }
}

// --- アクションハンドラ（Actions） ---
const handleSaveUser = async () => {
  if (!selectedUser.value) return

  isSaving.value = true
  try {
    await updateUser(selectedUser.value.id, { ...form })
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
  <div class="flex flex-col lg:flex-row gap-section-gap items-start">
    <!-- 左ペイン: ユーザー一覧 -->
    <aside class="w-full lg:w-[340px] shrink-0 flex flex-col gap-panel-gap min-h-0">
      <header class="flex items-center justify-between gap-item-gap">
        <h3 class="flex items-center gap-item-gap">
          <Icon name="users" class="text-primary" />
          <span>ユーザー一覧</span>
        </h3>
        <div class="flex items-center gap-item-gap">
          <Button
            icon="plus"
            @click="openCreateModal"
          >
            新規登録
          </Button>
        </div>
      </header>
      <hr class="divider">

      <Input
        v-model="searchQuery"
        placeholder="氏名・カナ・IDで検索..."
      />

      <ul
        v-if="filteredUsers.length > 0"
        class="flex flex-col gap-item-gap overflow-y-auto flex-1 min-h-[300px]"
      >
        <li
          v-for="user in filteredUsers"
          :key="user.id"
        >
          <button
            type="button"
            class="panel p-panel-pad-compact is-interactive w-full flex flex-col gap-inline-gap text-left"
            :class="{ 'is-active': user.id === selectedUserId }"
            @click="selectedUserId = user.id"
          >
            <div class="flex items-center gap-item-gap min-w-0">
              <span>
                {{ user.lastName }} {{ user.firstName }}
              </span>
              <span v-if="user.requirePasswordReset" class="badge shrink-0" :style="{ '--glow-color': 'var(--color-status-danger)' }">
                PWリセット要
              </span>
            </div>

            <div class="text-secondary">
              ID: {{ user.loginId || user.id }}
            </div>
          </button>
        </li>
      </ul>

      <EmptyState
        v-else
        icon="search"
        title="該当するユーザーがいません"
        description="検索条件を変更するか、新規ユーザーを登録してください。"
        class="flex-1 min-h-[300px] flex items-center justify-center"
      />
    </aside>

    <hr class="divider is-vertical is-solid hidden lg:block self-stretch">

    <!-- 右ペイン: ユーザー詳細設定 -->
    <section class="panel flex-1 min-w-0">
      <EmptyState
        v-if="!selectedUser"
        icon="users"
        title="ユーザーが選択されていません"
        description="左側のユーザー一覧から、設定を行うユーザーを選択してください。"
        class="min-h-[400px] flex items-center justify-center"
      />

      <div v-else class="flex flex-1 flex-col gap-panel-gap min-h-0">
        <header class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap">
          <h3 class="flex items-center gap-item-gap">
            <Icon name="user" class="text-primary" />
            <span class="flex flex-wrap items-center gap-item-gap">
              <span class="badge" :style="{ '--glow-color': USER_ROLE_CONFIG[selectedUser.role]?.color }">
                {{ USER_ROLE_CONFIG[selectedUser.role]?.label }}
              </span>
              <span v-if="selectedUser.requirePasswordReset" class="badge" :style="{ '--glow-color': 'var(--color-status-danger)' }">
                PWリセット要
              </span>
              <small>
                (ID: {{ selectedUser.loginId || selectedUser.id }})
              </small>
            </span>
          </h3>

          <div class="flex flex-wrap items-center gap-item-gap">
            <Button @click="confirmResetPassword(selectedUser)">
              PW初期化
            </Button>
            <Button
              variant="danger"
              :disabled="selectedUser.id === 'master'"
              @click="confirmDelete(selectedUser)"
            >
              削除
            </Button>
            <Button
              variant="success"
              icon="save"
              :loading="isSaving"
              @click="handleSaveUser"
            >
              変更を保存
            </Button>
          </div>
        </header>
        <hr class="divider">

        <nav class="tabs flex items-center gap-inline-gap overflow-x-auto">
          <button
            v-for="item in USER_SETTINGS_TABS"
            :key="item.value"
            type="button"
            class="tabs-item"
            :class="{ 'is-active': activeCategory === item.value }"
            @click="activeCategory = item.value"
          >
            <Icon v-if="item.icon" :name="item.icon" size="sm" />
            <span>{{ item.label }}</span>
          </button>
        </nav>

        <!-- 基本情報タブ -->
        <div v-if="activeCategory === 'basic'" class="flex flex-col gap-form-row-gap max-w-xl">
          <header class="flex items-center gap-item-gap">
            <h4 class="flex items-center gap-item-gap">
              <Icon name="info" class="text-primary" />
              <span>ユーザー基本情報</span>
            </h4>
          </header>
          <hr class="divider">

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-form-col-gap gap-y-form-row-gap">
            <div class="flex flex-col gap-inline-gap">
              <label for="user-last-name" class="label">姓</label>
              <Input
                id="user-last-name"
                v-model="form.lastName"
                placeholder="例: 松田"
              />
            </div>
            <div class="flex flex-col gap-inline-gap">
              <label for="user-first-name" class="label">名</label>
              <Input
                id="user-first-name"
                v-model="form.firstName"
                placeholder="例: 飛鳥"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-form-col-gap gap-y-form-row-gap">
            <div class="flex flex-col gap-inline-gap">
              <label for="user-last-name-kana" class="label">姓（ふりがな）</label>
              <Input
                id="user-last-name-kana"
                v-model="form.lastNameKana"
                placeholder="例: まつだ"
              />
            </div>
            <div class="flex flex-col gap-inline-gap">
              <label for="user-first-name-kana" class="label">名（ふりがな）</label>
              <Input
                id="user-first-name-kana"
                v-model="form.firstNameKana"
                placeholder="例: あすか"
              />
            </div>
          </div>

          <div class="flex flex-col gap-inline-gap">
            <label for="user-login-id" class="label">ログインID</label>
            <Input
              id="user-login-id"
              :model-value="selectedUser.loginId || selectedUser.id"
              disabled
            />
          </div>

          <div class="flex flex-col gap-inline-gap">
            <label for="user-role" class="label">権限</label>
            <Select
              id="user-role"
              v-model="form.role"
              :options="USER_ROLE_OPTIONS"
              :disabled="selectedUser.id === 'master'"
            />
          </div>

          <Checkbox
            v-model="form.requirePasswordReset"
            label="次回ログイン時にパスワード変更を要求する"
          />

          <div class="flex flex-col gap-inline-gap">
            <span class="label">最終ログイン日時</span>
            <small class="text-secondary">
              {{ lastLoginText }}
            </small>
          </div>
        </div>

        <!-- 現場アサインタブ -->
        <div v-else-if="activeCategory === 'assign'" class="flex flex-col gap-form-row-gap max-w-xl">
          <header class="flex items-center gap-item-gap">
            <h4 class="flex items-center gap-item-gap">
              <Icon name="building" class="text-primary" />
              <span>参加現場アサイン</span>
            </h4>
          </header>
          <hr class="divider">

          <small>
            このユーザーが参加・閲覧できる現場を選択してください。
          </small>

          <ul v-if="sites.length > 0" class="flex flex-col gap-item-gap">
            <li
              v-for="site in sites"
              :key="site.id"
            >
              <div class="assign-item flex items-center justify-between gap-panel-gap p-item-gap">
                <Checkbox
                  :model-value="isSiteAssigned(site.id)"
                  :label="`${site.name} (${site.id})`"
                  @update:model-value="handleToggleSite(site.id, $event)"
                />

                <div v-if="isSiteAssigned(site.id)" class="w-36 shrink-0 flex flex-col">
                  <label :for="`site-role-${site.id}`" class="sr-only">現場権限</label>
                  <Select
                    :id="`site-role-${site.id}`"
                    :model-value="getSiteRole(site.id)"
                    :options="USER_ROLE_OPTIONS"
                    @update:model-value="handleSiteRoleChange(site.id, $event)"
                  />
                </div>
              </div>
            </li>
          </ul>

          <EmptyState
            v-else
            icon="inbox"
            title="登録された現場がありません"
            description="現場管理タブから現場を作成してください。"
          />
        </div>
      </div>
    </section>
  </div>

  <!-- 新規ユーザー登録モーダル -->
  <Modal
    v-model="isCreateModalOpen"
    title="新規ユーザー登録"
    icon="circle-plus"
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

      <div
        v-for="field in USER_CREATE_FORM_FIELDS"
        :key="field.id"
        class="flex flex-col gap-inline-gap"
      >
        <label :for="`create-user-${field.id}`" class="label">{{ field.label }}</label>
        <Input
          :id="`create-user-${field.id}`"
          v-model="newUser[field.id]"
          :placeholder="field.placeholder"
        />
      </div>

      <div class="flex flex-col gap-inline-gap">
        <label for="create-user-role" class="label">権限</label>
        <Select
          id="create-user-role"
          v-model="newUser.role"
          :options="USER_ROLE_OPTIONS"
        />
      </div>

      <Checkbox
        v-model="newUser.requirePasswordReset"
        label="初回ログイン時にパスワード変更を要求する"
      />
    </form>
  </Modal>

  <PortalModalUserCredential
    v-model="isCredentialModalOpen"
    :user="credentialTarget"
  />
</template>

<style scoped lang="scss">
.text-secondary {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.assign-item {
  background-color: var(--color-bg-hover);
}
</style>
