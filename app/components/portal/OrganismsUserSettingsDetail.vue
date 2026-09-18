<script setup lang="ts">
/**
 * OrganismsUserSettingsDetail
 * [Portal Organisms] ユーザー管理の右ペイン（Detail）。
 * 選択されたユーザーの基本設定（氏名、権限、PWリセット要求）、現場アサイン、PW初期化・削除を一括提供します。
 * 内部コンポーネントとして以下の Molecules をオーケストレートします:
 * - PortalMoleculesUserBasicSettings
 * - PortalMoleculesUserSiteAssignment
 */
import { ref, watch } from 'vue'

import type { Site } from '~/types/admin'
import type { User, UserRole } from '~/types/auth'
import type { RadioOption } from '~/types/components'

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
</script>

<template>
  <div class="flex flex-col gap-5 w-full">
    <!-- 未選択時 -->
    <template v-if="!user">
      <EmptyState
        icon="users"
        title="ユーザーが選択されていません"
        description="左側のユーザー一覧から、設定を行うユーザーを選択してください。"
        class="placeholder-empty min-h-[400px] flex items-center justify-center"
      />
    </template>

    <!-- ユーザー選択時 -->
    <template v-else>
      <!-- 上部ヘッダー: ユーザー名 + 権限 + アクションボタン -->
      <SectionHeader
        :title="`${user.lastName || ''} ${user.firstName || ''}`"
        icon="user"
      >
        <template #default>
          <div class="flex flex-wrap items-center gap-2">
            <span>{{ user.lastName }} {{ user.firstName }}</span>
            <Badge :id="`role:${user.role}`" />
            <Badge v-if="user.requirePasswordReset" id="user:pwd-reset" />
            <span class="user-id-label ml-1">
              (ID: {{ user.loginId || user.id }})
            </span>
          </div>
        </template>

        <template #actions>
          <div class="flex flex-wrap items-center gap-2">
            <Button
              @click="emit('reset-password', user)"
            >
              PW初期化
            </Button>
            <Button
              variant="danger"
              :disabled="user.id === 'master'"
              @click="emit('delete', user)"
            >
              削除
            </Button>
            <Button
              variant="success"
              icon="save"
              :loading="isSaving"
              @click="handleSave"
            >
              {{ isSaving ? '保存中...' : '変更を保存' }}
            </Button>
          </div>
        </template>
      </SectionHeader>

      <!-- カテゴリ選択 (Tabs) -->
      <Tabs
        v-model="activeCategory"
        :options="categoryOptions"
      >
        <!-- 1. 基本情報設定 -->
        <template #basic>
          <PortalMoleculesUserBasicSettings
            :user="user"
            :last-name="editLastName"
            :first-name="editFirstName"
            :last-name-kana="editLastNameKana"
            :first-name-kana="editFirstNameKana"
            :user-role="editRole"
            :require-password-reset="editRequirePasswordReset"
            @update:last-name="editLastName = $event"
            @update:first-name="editFirstName = $event"
            @update:last-name-kana="editLastNameKana = $event"
            @update:first-name-kana="editFirstNameKana = $event"
            @update:user-role="editRole = $event"
            @update:require-password-reset="editRequirePasswordReset = $event"
          />
        </template>

        <!-- 2. 現場アサイン設定 -->
        <template #assign>
          <PortalMoleculesUserSiteAssignment
            v-model="editAssignedSiteIds"
            :site-list="siteList"
          />
        </template>
      </Tabs>
    </template>
  </div>
</template>

<style scoped lang="scss">
.user-id-label {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
