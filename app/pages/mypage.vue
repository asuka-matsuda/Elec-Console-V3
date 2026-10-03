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
import { USER_ROLE_CONFIG } from '~/constants/adminConstants'
import { THEME_OPTIONS } from '~/constants/colors'
import { formatUserFullName, formatUserKana } from '~/utils/user'

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

const fullName = computed(() => formatUserFullName(currentUser.value))
const kana = computed(() => formatUserKana(currentUser.value))

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
  <div class="flex flex-col gap-section-gap max-w-2xl">
    <header>
      <h2 class="flex items-center gap-item-gap">
        <Icon name="user" />
        <span>マイページ</span>
      </h2>
    </header>
    <hr class="divider">

    <section class="panel flex flex-col gap-panel-gap">
      <header class="flex items-center justify-between">
        <h3 class="flex items-center gap-item-gap">
          <Icon name="user" />
          <span>アカウント情報</span>
        </h3>
      </header>

      <div v-if="!currentUser" class="text-muted">
        アカウント情報を読み込み中...
      </div>

      <div v-else class="flex flex-col gap-panel-gap">
        <dl class="grid grid-cols-1 sm:grid-cols-3 gap-panel-gap">
          <div class="flex flex-col gap-inline-gap">
            <dt class="profile-label">
              氏名
            </dt>
            <dd class="flex flex-col">
              <span class="profile-name">{{ fullName }}</span>
              <span v-if="kana" class="profile-kana">
                {{ kana }}
              </span>
            </dd>
          </div>

          <div class="flex flex-col gap-inline-gap">
            <dt class="profile-label">
              ログインID
            </dt>
            <dd class="profile-id">
              {{ currentUser.loginId || currentUser.id }}
            </dd>
          </div>

          <div class="flex flex-col gap-inline-gap">
            <dt class="profile-label">
              基本権限
            </dt>
            <dd class="flex items-center">
              <span class="badge" :style="{ '--glow-color': USER_ROLE_CONFIG[currentUser.role]?.color }">
                {{ USER_ROLE_CONFIG[currentUser.role]?.label || currentUser.role }}
              </span>
            </dd>
          </div>
        </dl>

        <hr class="divider">

        <div class="flex flex-col gap-item-gap">
          <small class="profile-label">登録済現場</small>

          <p v-if="assignedSites.length === 0" class="text-secondary">
            登録されている現場はありません。
          </p>

          <ul v-else class="flex flex-col gap-item-gap">
            <li
              v-for="site in assignedSites"
              :key="site.id"
            >
              <div
                class="site-row flex items-center justify-between gap-item-gap flex-wrap p-panel-pad-compact"
              >
                <div class="flex items-center gap-item-gap flex-wrap">
                  <Icon name="map-pin" size="sm" />
                  <span class="site-name">{{ site.name }}</span>
                  <small class="site-id">({{ site.id }})</small>
                  <span class="badge" :style="{ '--glow-color': USER_ROLE_CONFIG[site.role]?.color }">
                    {{ USER_ROLE_CONFIG[site.role]?.label || site.role }}
                  </span>
                </div>

                <Button
                  :to="`/portal/${site.id}`"
                  icon-right="arrow-right"
                >
                  現場を開く
                </Button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section class="panel flex flex-col gap-panel-gap">
      <header class="flex items-center justify-between">
        <h3 class="flex items-center gap-item-gap">
          <Icon name="lock" />
          <span>パスワード変更</span>
        </h3>
      </header>

      <form class="flex flex-col gap-form-row-gap" @submit.prevent="handleChangePassword">
        <Alert v-if="isSuccess" variant="success">
          パスワードを変更しました
        </Alert>

        <div class="flex flex-col gap-inline-gap">
          <label for="my-current-password" class="label">現在のパスワード <span class="req-mark">＊</span></label>
          <Input
            id="my-current-password"
            v-model="currentPassword"
            type="password"
            placeholder="現在のパスワードを入力"
            autocomplete="current-password"
            :disabled="isLoading"
          />
          <p v-if="passwordError" class="error-text">
            {{ passwordError }}
          </p>
        </div>

        <div class="flex flex-col gap-inline-gap">
          <label for="my-new-password" class="label">新しいパスワード (8文字以上) <span class="req-mark">＊</span></label>
          <Input
            id="my-new-password"
            v-model="newPassword"
            type="password"
            placeholder="新しいパスワードを入力"
            autocomplete="new-password"
            :disabled="isLoading"
          />
        </div>

        <div class="flex flex-col gap-inline-gap">
          <label for="my-confirm-password" class="label">新しいパスワード（確認用） <span class="req-mark">＊</span></label>
          <Input
            id="my-confirm-password"
            v-model="confirmPassword"
            type="password"
            placeholder="もう一度入力"
            autocomplete="new-password"
            :disabled="isLoading"
          />
        </div>

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
    </section>

    <section class="panel flex flex-col gap-panel-gap">
      <header class="flex items-center justify-between">
        <h3 class="flex items-center gap-item-gap">
          <Icon name="sliders" />
          <span>表示設定</span>
        </h3>
      </header>

      <div class="flex flex-col gap-inline-gap">
        <label for="theme-mode" class="label">外観モード</label>
        <Select id="theme-mode" v-model="themeMode" :options="THEME_OPTIONS" />
        <span class="help-text">全体の明るさを切り替えます（ダークモード推奨）</span>
      </div>

      <div class="flex flex-col gap-inline-gap">
        <span class="label">演出・モーション効果</span>
        <Checkbox
          v-model="animationEnabled"
          label="パルス・モーション演出を有効にする"
        />
        <span class="help-text">OFFにすると、サイバーパルス光やスケール演出を停止し、静止表示にします</span>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.profile-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-muted);
  letter-spacing: var(--tracking-wider);
}

.profile-name {
  font-weight: var(--font-weight-bold);
  color: var(--color-text-main);
}

.profile-kana {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.profile-id {
  font-family: var(--font-mono);
  color: var(--color-text-main);
}

.site-name {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-main);
}

.site-row {
  border: var(--border-width-base) solid var(--color-border);
  background-color: var(--surface-bg-elevated);
}

.site-id {
  color: var(--color-text-muted);
}

.text-secondary {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.text-muted {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.error-text {
  font-size: var(--font-size-xs);
  color: var(--color-status-danger);
}

.help-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
