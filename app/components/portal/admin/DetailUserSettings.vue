<script setup lang="ts">
/**
 * DetailUserSettings
 * [Portal Organisms] ユーザー管理の右ペイン（詳細設定コンソール）。
 * 選択されたユーザーの基本設定、現場アサイン、PW初期化・削除を一括提供します。
 */
import { computed, reactive, ref, watch } from 'vue'

import type { SiteAssignment, User, UserRole } from '#shared/types/auth'
import type { Site } from '#shared/types/site'
import { USER_ROLE_OPTIONS, USER_SETTINGS_TABS } from '~/constants/adminConstants'
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

// 編集用ステート（単一のリアクティブオブジェクトに集約）
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
  return props.user?.lastLoginAt ? formatDateTime(props.user.lastLoginAt) : '未ログイン'
})

watch(
  () => props.user,
  (newUser) => {
    if (newUser) {
      form.lastName = newUser.lastName || ''
      form.firstName = newUser.firstName || ''
      form.lastNameKana = newUser.lastNameKana || ''
      form.firstNameKana = newUser.firstNameKana || ''
      form.role = newUser.role || 'worker'
      form.requirePasswordReset = !!newUser.requirePasswordReset
      form.assignedSiteIds = [...(newUser.assignedSiteIds || [])]
      form.siteAssignments = newUser.siteAssignments
        ? newUser.siteAssignments.map(sa => ({ ...sa }))
        : (newUser.assignedSiteIds || []).map(id => ({ siteId: id, role: newUser.role || 'worker' }))
    }
  },
  { immediate: true },
)

const isSiteAssigned = (siteId: string) => {
  return form.assignedSiteIds.includes(siteId)
}

const getSiteRole = (siteId: string): UserRole => {
  const found = form.siteAssignments.find(sa => sa.siteId === siteId)

  return found?.role || form.role || 'worker'
}

const handleToggleSite = (siteId: string, assigned: unknown) => {
  const isChecked = !!assigned

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

const handleSave = () => {
  emit('save', { ...form })
}
</script>

<template>
  <div class="flex flex-col gap-5 w-full">

    <EmptyState
      v-if="!user"
      icon="users"
      title="ユーザーが選択されていません"
      description="左側のユーザー一覧から、設定を行うユーザーを選択してください。"
      class="placeholder-empty min-h-[400px] flex items-center justify-center"
    />

    <div v-else class="flex flex-col gap-5 w-full">

      <SectionHeader icon="user">
        <template #default>
          <div class="flex flex-wrap items-center gap-2">
            <span>{{ user.lastName }} {{ user.firstName }}</span>
            <Badge :id="`role:${user.role}`" />
            <Badge v-if="user.requirePasswordReset" id="user:pwd-reset" />
            <span class="user-id">
              (ID: {{ user.loginId || user.id }})
            </span>
          </div>
        </template>

        <template #actions>
          <div class="flex flex-wrap items-center gap-2">
            <Button @click="emit('reset-password', user)">
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
              変更を保存
            </Button>
          </div>
        </template>
      </SectionHeader>

      <Tabs
        v-model="activeCategory"
        :options="USER_SETTINGS_TABS"
      >

        <template #basic>
          <div class="flex flex-col gap-5 max-w-xl">
            <SectionHeader
              title="ユーザー基本情報"
              icon="info"
              tag="h4"
            />

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormGroup label="姓">
                <Input
                  v-model="form.lastName"
                  placeholder="例: 松田"
                />
              </FormGroup>
              <FormGroup label="名">
                <Input
                  v-model="form.firstName"
                  placeholder="例: 飛鳥"
                />
              </FormGroup>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormGroup label="姓（ふりがな）">
                <Input
                  v-model="form.lastNameKana"
                  placeholder="例: まつだ"
                />
              </FormGroup>
              <FormGroup label="名（ふりがな）">
                <Input
                  v-model="form.firstNameKana"
                  placeholder="例: あすか"
                />
              </FormGroup>
            </div>

            <FormGroup label="ログインID">
              <Input
                :model-value="user.loginId || user.id"
                disabled
              />
            </FormGroup>

            <FormGroup label="権限">
              <Select
                v-model="form.role"
                :options="USER_ROLE_OPTIONS"
                :disabled="user.id === 'master'"
              />
            </FormGroup>

            <Checkbox
              v-model="form.requirePasswordReset"
              label="次回ログイン時にパスワード変更を要求する"
            />

            <FormGroup label="最終ログイン日時">
              <div class="last-login-text pt-1">
                {{ lastLoginText }}
              </div>
            </FormGroup>
          </div>
        </template>

        <template #assign>
          <div class="flex flex-col gap-4 max-w-xl">
            <SectionHeader
              title="参加現場アサイン"
              icon="building"
              tag="h4"
            />

            <p class="desc-text m-0">
              このユーザーが参加・閲覧できる現場を選択してください。
            </p>

            <div v-if="siteList.length > 0" class="flex flex-col gap-2">
              <div
                v-for="site in siteList"
                :key="site.id"
                class="flex items-center justify-between p-2.5 site-assign-row gap-3"
              >
                <Checkbox
                  :model-value="isSiteAssigned(site.id)"
                  :label="`${site.name} (${site.id})`"
                  @update:model-value="handleToggleSite(site.id, $event)"
                />

                <div v-if="isSiteAssigned(site.id)" class="w-36 flex-shrink-0">
                  <Select
                    :model-value="getSiteRole(site.id)"
                    :options="USER_ROLE_OPTIONS"
                    size="sm"
                    @update:model-value="handleSiteRoleChange(site.id, $event)"
                  />
                </div>
              </div>
            </div>

            <EmptyState
              v-else
              icon="inbox"
              title="登録された現場がありません"
              description="現場管理タブから現場を作成してください。"
            />
          </div>
        </template>
      </Tabs>
    </div>
  </div>
</template>

<style scoped>
.user-id {
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
  line-height: var(--line-height-base);
  color: var(--color-text-muted);
}

.site-assign-row {
  border: var(--border-width-base) solid var(--color-border);
  background-color: color-mix(in srgb, var(--surface-bg-elevated) 30%, transparent);
}
</style>
