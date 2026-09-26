<script setup lang="ts">
/**
 * マイページ
 * /mypage
 *
 * アカウント情報、パスワード変更、および表示設定（テーマ・アニメーション）を集約・管理します。
 */
import { computed } from 'vue'

import { useHead } from '#app'
import { useAdminSites } from '~/composables/admin/useAdminSites'
import { useAuth } from '~/composables/useAuth'
import { usePasswordChange } from '~/composables/usePasswordChange'
import { useSettings } from '~/composables/useSettings'
import { THEME_OPTIONS } from '~/constants/colors'

useHead({ title: 'マイページ - Elec-Console' })

const { currentUser } = useAuth()
const { sites, fetchSites, isLoaded: isSitesLoaded } = useAdminSites()
const { themeMode, animationEnabled } = useSettings()
const {
  currentPassword,
  newPassword,
  confirmPassword,
  passwordError,
  isSuccess,
  isLoading,
  handleChangePassword,
} = usePasswordChange()

if (import.meta.client && !isSitesLoaded?.value) {
  fetchSites()
}

const assignedSites = computed(() => {
  if (!currentUser.value?.assignedSiteIds) return []

  return sites.value
    .filter(site => currentUser.value?.assignedSiteIds.includes(site.id))
    .map((site) => {
      const assignment = currentUser.value?.siteAssignments?.find(sa => sa.siteId === site.id)

      return {
        ...site,
        role: assignment?.role || currentUser.value?.role || 'worker',
      }
    })
})
</script>

<template>
  <div class="flex flex-col gap-section-gap pb-layout-pad max-w-2xl">
    <SectionHeader title="マイページ" icon="user" />

    <Panel as="section" class="flex flex-col gap-panel-gap">
      <SectionHeader title="アカウント情報" icon="user" tag="h3" />

      <div v-if="currentUser" class="flex flex-col gap-panel-gap">
        <PortalPanelUserProfile :user="currentUser" />

        <Divider />

        <div class="flex flex-col gap-item-gap">
          <small>登録済現場</small>
          <p v-if="assignedSites.length === 0" class="m-0">
            登録されている現場はありません。
          </p>
          <ul v-else class="flex flex-col gap-item-gap p-0 m-0 list-none">
            <li
              v-for="site in assignedSites"
              :key="site.id"
            >
              <Panel
                as="div"
                padding="compact"
                class="flex items-center justify-between gap-item-gap flex-wrap"
              >
                <div class="flex items-center gap-item-gap flex-wrap">
                  <Icon name="map-pin" size="sm" />
                  <span>{{ site.name }}</span>
                  <small>({{ site.id }})</small>
                  <Badge :id="`role:${site.role}`" />
                </div>

                <Button
                  :to="`/portal/${site.id}`"
                  icon-right="arrow-right"
                >
                  現場を開く
                </Button>
              </Panel>
            </li>
          </ul>
        </div>
      </div>

      <div v-else>
        アカウント情報を読み込み中...
      </div>
    </Panel>

    <Panel as="section" class="flex flex-col gap-panel-gap">
      <SectionHeader title="パスワード変更" icon="lock" tag="h3" />

      <form class="flex flex-col gap-form-row-gap" @submit.prevent="handleChangePassword">
        <Alert v-if="isSuccess" variant="success">
          パスワードを変更しました
        </Alert>

        <FormGroup
          label="現在のパスワード"
          required
          :error="passwordError"
        >
          <Input
            v-model="currentPassword"
            type="password"
            placeholder="現在のパスワードを入力"
            autocomplete="current-password"
            :disabled="isLoading"
            :clearable="false"
          />
        </FormGroup>

        <FormGroup
          label="新しいパスワード (8文字以上)"
          required
        >
          <Input
            v-model="newPassword"
            type="password"
            placeholder="新しいパスワードを入力"
            autocomplete="new-password"
            :disabled="isLoading"
            :clearable="false"
          />
        </FormGroup>

        <FormGroup
          label="新しいパスワード（確認用）"
          required
        >
          <Input
            v-model="confirmPassword"
            type="password"
            placeholder="もう一度入力"
            autocomplete="new-password"
            :disabled="isLoading"
            :clearable="false"
          />
        </FormGroup>

        <div class="flex items-center justify-end pt-inline-gap">
          <Button
            type="submit"
            variant="default"
            icon="check"
            :loading="isLoading"
          >
            パスワードを変更する
          </Button>
        </div>
      </form>
    </Panel>

    <Panel as="section" class="flex flex-col gap-panel-gap">
      <SectionHeader title="表示設定" icon="sliders" tag="h3" />

      <FormGroup
        label="外観モード"
        help="全体の明るさを切り替えます（ダークモード推奨）"
      >
        <Select v-model="themeMode" :options="THEME_OPTIONS" />
      </FormGroup>

      <FormGroup
        label="演出・モーション効果"
        help="OFFにすると、サイバーパルス光やスケール演出を停止し、静止表示にします"
      >
        <Checkbox
          v-model="animationEnabled"
          label="パルス・モーション演出を有効にする"
        />
      </FormGroup>
    </Panel>
  </div>
</template>
