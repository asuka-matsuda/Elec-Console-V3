<script setup lang="ts">
/**
 * OrganismsUserSettingsDetail
 * [Portal Organisms] ユーザー管理の右ペイン（Detail）。
 * 選択されたユーザーの基本設定（氏名、権限、PWリセット要求）、現場アサイン、PW初期化・削除を一括提供します。
 */
import { ref, watch } from 'vue'

import { USER_ROLE_OPTIONS } from '~/constants/adminConstants'
import type { Site } from '~/types/admin'
import type { User, UserRole } from '~/types/auth'
import type { RadioOption } from '~/types/components'
import { formatDateTime } from '~/utils/date'

const props = defineProps<{
  user: User | null
  siteList: Site[]
  isSaving?: boolean
}>()

const emit = defineEmits<{
  'save': [updates: Partial<User>]
  'reset-password': [user: User]
  'delete': [user: User]
}>()

const activeCategory = ref<'basic' | 'assign'>('basic')

const categoryOptions: RadioOption<'basic' | 'assign'>[] = [
  { label: '基本情報', value: 'basic' },
  { label: '現場アサイン', value: 'assign' },
]

// 編集用ステート
const editLastName = ref('')
const editFirstName = ref('')
const editLastNameKana = ref('')
const editFirstNameKana = ref('')
const editRole = ref<UserRole>('worker')
const editRequirePasswordReset = ref(false)
const editAssignedSiteIds = ref<string[]>([])

watch(
  () => props.user,
  (newUser) => {
    if (newUser) {
      editLastName.value = newUser.lastName || ''
      editFirstName.value = newUser.firstName || ''
      editLastNameKana.value = newUser.lastNameKana || ''
      editFirstNameKana.value = newUser.firstNameKana || ''
      editRole.value = newUser.role || 'worker'
      editRequirePasswordReset.value = !!newUser.requirePasswordReset
      editAssignedSiteIds.value = [...(newUser.assignedSiteIds || [])]
    }
  },
  { immediate: true },
)

const handleSave = () => {
  emit('save', {
    lastName: editLastName.value,
    firstName: editFirstName.value,
    lastNameKana: editLastNameKana.value,
    firstNameKana: editFirstNameKana.value,
    role: editRole.value,
    requirePasswordReset: editRequirePasswordReset.value,
    assignedSiteIds: editAssignedSiteIds.value,
  })
}

const formatLastLogin = (user: User) => {
  if (!user.lastLoginAt) return '未ログイン'

  return formatDateTime(user.lastLoginAt as string)
}
</script>

<template>
  <div class="flex flex-col gap-5 w-full">
    <!-- 未選択時 -->
    <template v-if="!user">
      <MoleculesEmptyState
        icon="users"
        title="ユーザーが選択されていません"
        description="左側のユーザー一覧から、設定を行うユーザーを選択してください。"
        class="placeholder-empty min-h-[400px] flex items-center justify-center"
      />
    </template>

    <!-- ユーザー選択時 -->
    <template v-else>
      <!-- 上部ヘッダー: ユーザー名 + 権限 + アクションボタン (MoleculesSectionHeader size="lg") -->
      <MoleculesSectionHeader
        :title="`${user.lastName || ''} ${user.firstName || ''}`"
        icon="user"
        size="lg"
      >
        <template #default>
          <div class="flex flex-wrap items-center gap-2">
            <span>{{ user.lastName }} {{ user.firstName }}</span>
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
            <span class="user-id-label ml-1">
              (ID: {{ user.loginId || user.id }})
            </span>
          </div>
        </template>

        <template #actions>
          <div class="flex flex-wrap items-center gap-2">
            <AtomsButton
              variant="secondary"
              @click="emit('reset-password', user)"
            >
              PW初期化
            </AtomsButton>
            <AtomsButton
              variant="danger"
              :disabled="user.id === 'master'"
              @click="emit('delete', user)"
            >
              削除
            </AtomsButton>
            <AtomsButton
              variant="primary"
              icon="save"
              :disabled="isSaving"
              @click="handleSave"
            >
              {{ isSaving ? '保存中...' : '変更を保存' }}
            </AtomsButton>
          </div>
        </template>
      </MoleculesSectionHeader>

      <!-- カテゴリ選択 (AtomsRadioGroup) -->
      <div class="overflow-x-auto pb-1">
        <AtomsRadioGroup
          v-model="activeCategory"
          :options="categoryOptions"
        />
      </div>

      <!-- 1. 基本情報設定 -->
      <div v-if="activeCategory === 'basic'" class="flex flex-col gap-5 max-w-xl">
        <MoleculesSectionHeader
          title="ユーザー基本情報"
          icon="info"
          size="sm"
        />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MoleculesFormGroup label="姓">
            <AtomsInput v-model="editLastName" placeholder="例: 松田" />
          </MoleculesFormGroup>
          <MoleculesFormGroup label="名">
            <AtomsInput v-model="editFirstName" placeholder="例: 飛鳥" />
          </MoleculesFormGroup>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MoleculesFormGroup label="姓（ふりがな）">
            <AtomsInput v-model="editLastNameKana" placeholder="例: まつだ" />
          </MoleculesFormGroup>
          <MoleculesFormGroup label="名（ふりがな）">
            <AtomsInput v-model="editFirstNameKana" placeholder="例: あすか" />
          </MoleculesFormGroup>
        </div>

        <MoleculesFormGroup label="ログインID">
          <AtomsInput
            :model-value="user.loginId || user.id"
            disabled
          />
        </MoleculesFormGroup>

        <MoleculesFormGroup label="権限">
          <AtomsSelect
            v-model="editRole"
            :options="USER_ROLE_OPTIONS"
            :disabled="user.id === 'master'"
          />
        </MoleculesFormGroup>

        <MoleculesFormGroup>
          <AtomsCheckbox
            v-model="editRequirePasswordReset"
            label="次回ログイン時にパスワード変更を要求する"
          />
        </MoleculesFormGroup>

        <MoleculesFormGroup label="最終ログイン日時">
          <div class="last-login-text pt-1">
            {{ formatLastLogin(user) }}
          </div>
        </MoleculesFormGroup>
      </div>

      <!-- 2. 現場アサイン設定 -->
      <div v-else-if="activeCategory === 'assign'" class="flex flex-col gap-4 max-w-xl">
        <MoleculesSectionHeader
          title="参加現場アサイン"
          icon="building"
          size="sm"
        />

        <p class="desc-text">
          このユーザーが参加・閲覧できる現場を選択してください。
        </p>

        <div v-if="siteList.length > 0" class="flex flex-col gap-2">
          <template v-for="site in siteList" :key="site.id">
            <MoleculesFormGroup>
              <AtomsCheckbox
                v-model="editAssignedSiteIds"
                :value="site.id"
                :label="`${site.name} (${site.id})`"
              />
            </MoleculesFormGroup>
          </template>
        </div>

        <MoleculesEmptyState
          v-else
          icon="inbox"
          title="登録された現場がありません"
          description="現場管理タブから現場を作成してください。"
        />
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.user-id-label {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.last-login-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.desc-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.placeholder-empty {
  border: var(--border-width-base) dashed var(--color-border);
  border-radius: var(--radius-md, 6px);
}
</style>
