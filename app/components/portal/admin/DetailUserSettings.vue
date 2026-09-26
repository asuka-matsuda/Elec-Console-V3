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
  <section class="flex flex-col gap-section-gap">

    <EmptyState
      v-if="!user"
      icon="users"
      title="ユーザーが選択されていません"
      description="左側のユーザー一覧から、設定を行うユーザーを選択してください。"
      class="placeholder-empty min-h-[400px] flex items-center justify-center"
    />

    <template v-else>

      <SectionHeader icon="user">
        <template #default>
          <div class="flex flex-wrap items-center gap-item-gap">
            <span>{{ user.lastName }} {{ user.firstName }}</span>
            <Badge :id="`role:${user.role}`" />
            <Badge v-if="user.requirePasswordReset" id="user:pwd-reset" />
            <small>
              (ID: {{ user.loginId || user.id }})
            </small>
          </div>
        </template>

        <template #actions>
          <div class="flex flex-wrap items-center gap-item-gap">
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
          <div class="flex flex-col gap-form-row-gap max-w-xl">
            <SectionHeader
              title="ユーザー基本情報"
              icon="info"
              tag="h4"
            />

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-form-col-gap gap-y-form-row-gap">
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

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-form-col-gap gap-y-form-row-gap">
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
              <small>
                {{ lastLoginText }}
              </small>
            </FormGroup>
          </div>
        </template>

        <template #assign>
          <div class="flex flex-col gap-form-row-gap max-w-xl">
            <SectionHeader
              title="参加現場アサイン"
              icon="building"
              tag="h4"
            />

            <small class="m-0">
              このユーザーが参加・閲覧できる現場を選択してください。
            </small>

            <ul v-if="siteList.length > 0" class="flex flex-col gap-item-gap list-none m-0 p-0">
              <li
                v-for="site in siteList"
                :key="site.id"
              >
                <Panel
                  padding="compact"
                  class="flex items-center justify-between gap-panel-gap"
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
                </Panel>
              </li>
            </ul>

            <EmptyState
              v-else
              icon="inbox"
              title="登録された現場がありません"
              description="現場管理タブから現場を作成してください。"
            />
          </div>
        </template>
      </Tabs>
    </template>
  </section>
</template>
