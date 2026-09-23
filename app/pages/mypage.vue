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
import { THEME_OPTIONS } from '~/constants/constants'

useHead({ title: 'マイページ - Elec-Console' })

const { currentUser } = useAuth()
const { sites, fetchSites } = useAdminSites()
const { themeMode, animationEnabled } = useSettings()
const {
  newPassword,
  confirmPassword,
  passwordError,
  isSuccess,
  isLoading,
  handleChangePassword,
} = usePasswordChange()

if (import.meta.client && sites.value.length === 0) {
  fetchSites()
}

const fullName = computed(() => {
  if (!currentUser.value) return ''

  return `${currentUser.value.lastName} ${currentUser.value.firstName}`
})

const assignedSites = computed(() => {
  if (!currentUser.value?.assignedSiteIds) return []

  return sites.value.filter(site => currentUser.value?.assignedSiteIds.includes(site.id))
})
</script>

<template>
  <div class="flex flex-col gap-section-gap pb-layout-pad max-w-2xl">
    <SectionHeader title="マイページ" icon="user" />

    <Panel as="section" class="flex flex-col gap-4">
      <SectionHeader title="アカウント情報" icon="user" tag="h3" />

      <div v-if="currentUser" class="flex flex-col gap-4">
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 m-0 user-profile">
          <div class="flex flex-col gap-1">
            <dt>氏名</dt>
            <dd class="m-0 flex flex-col">
              <span class="user-name">{{ fullName }}</span>
              <span v-if="currentUser.lastNameKana || currentUser.firstNameKana" class="user-kana">
                {{ `${currentUser.lastNameKana || ''} ${currentUser.firstNameKana || ''}`.trim() }}
              </span>
            </dd>
          </div>

          <div class="flex flex-col gap-1">
            <dt>ログインID</dt>
            <dd class="m-0 font-login-id">
              {{ currentUser.loginId }}
            </dd>
          </div>

          <div class="flex flex-col gap-1">
            <dt>システム権限</dt>
            <dd class="m-0">
              <Badge :id="`role:${currentUser.role}`" />
            </dd>
          </div>
        </dl>

        <Divider />

        <div class="flex flex-col gap-2">
          <span class="field-label">担当現場</span>
          <p v-if="assignedSites.length === 0" class="empty-text m-0">
            割り当てられている現場はありません。
          </p>
          <ul v-else class="flex flex-col gap-2 p-0 m-0 list-none">
            <li
              v-for="site in assignedSites"
              :key="site.id"
              class="flex items-center justify-between p-3 site-item"
            >
              <div class="flex items-center gap-2">
                <Icon name="map-pin" size="sm" class="site-icon" />
                <span class="site-name">{{ site.name }}</span>
              </div>

              <NuxtLink
                :to="`/portal/${site.id}`"
                class="site-link"
              >
                現場を開く
                <Icon name="arrow-right" size="sm" />
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <div v-else class="empty-text">
        アカウント情報を読み込み中...
      </div>
    </Panel>

    <Panel as="section" class="flex flex-col gap-4">
      <SectionHeader title="パスワード変更" icon="lock" tag="h3" />

      <form class="flex flex-col gap-3" @submit.prevent="handleChangePassword">
        <FormGroup
          label="新しいパスワード (8文字以上)"
          required
          :error="passwordError"
        >
          <Input
            v-model="newPassword"
            type="password"
            placeholder="新しいパスワードを入力"
            autocomplete="new-password"
            :disabled="isLoading"
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
          />
        </FormGroup>

        <div class="flex items-center justify-between pt-1">
          <span v-if="isSuccess" class="flex items-center gap-1 success-msg">
            <Icon name="check" size="sm" /> パスワードを変更しました
          </span>
          <span v-else />

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

    <Panel as="section" class="flex flex-col gap-4">
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

<style scoped lang="scss">
.user-profile {
  dt {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wider);
  }

  .user-name {
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }

  .user-kana {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
  }

  .font-login-id {
    font-family: var(--font-mono);
    color: var(--color-text-main);
  }
}

.field-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
}

.empty-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.site-item {
  border: var(--border-width-base) solid var(--color-border);
  background-color: color-mix(in srgb, var(--surface-bg-elevated) 40%, transparent);
  transition: var(--transition-base);

  &:hover {
    border-color: var(--theme-accent);
  }

  .site-icon {
    color: var(--theme-accent);
  }

  .site-name {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }

  .site-link {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--theme-accent);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.success-msg {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-status-success);
}
</style>
