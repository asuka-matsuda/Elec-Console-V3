<script setup lang="ts">
/**
 * Portal Index
 * 現場ポータルのトップ（現場選択など）
 */
import { useLocalStorage } from '@vueuse/core'
import { computed, onMounted } from 'vue'

import { useHead, useRouter } from '#app'
import { useAdminSites } from '~/composables/admin/useAdminSites'
import { useAuth } from '~/composables/useAuth'
import { STORAGE_KEYS } from '~/constants/storageKeys'

useHead({ title: '現場ポータル - Elec-Console' })
const router = useRouter()
const { isAdmin, currentUser } = useAuth()
const { sites, fetchSites } = useAdminSites()
const lastSiteId = useLocalStorage(STORAGE_KEYS.LAST_SITE_ID, '')

const availableSites = computed(() => {
  if (isAdmin.value) return sites.value
  const siteIds = currentUser.value?.assignedSiteIds || []

  return sites.value.filter(s => siteIds.includes(s.id))
})

const autoRedirect = () => {
  const siteIds = currentUser.value?.assignedSiteIds || []

  if (siteIds.length > 0) {
    const targetSiteId = siteIds.includes(lastSiteId.value)
      ? lastSiteId.value
      : siteIds[0]

    router.replace(`/portal/${targetSiteId}`)

    return
  }
  if (lastSiteId.value && sites.value.some(s => s.id === lastSiteId.value)) {
    router.replace(`/portal/${lastSiteId.value}`)

    return
  }
  const firstSite = sites.value[0]

  if (firstSite) {
    router.replace(`/portal/${firstSite.id}`)
  }
}

onMounted(async () => {
  if (sites.value.length === 0) {
    await fetchSites()
  }
  autoRedirect()
})
</script>

<template>
  <div class="p-portal-index">
    <AppPanel>
      <AppSectionHeader title="現場ポータル" variant="hud" />
      <div class="p-portal-index__content">
        <p class="u-text-muted">
          アクセスする現場ポータルを選択してください。
        </p>

        <div v-if="availableSites.length > 0" class="p-portal-index__grid">
          <MenuTile
            v-for="site in availableSites"
            :key="site.id"
            :title="site.name"
            :to="`/portal/${site.id}`"
            icon="folder"
          >
            <template #badge>
              <AppBadge :color="site.status === 'in_progress' ? 'var(--color-status-success)' : 'var(--color-status-neutral)'">
                {{ site.status === 'in_progress' ? '進行中' : '準備中' }}
              </AppBadge>
            </template>
            <div class="u-text-xs u-text-muted">
              現場ID: {{ site.id }}
            </div>
          </MenuTile>
        </div>

        <div v-else class="u-text-muted u-text-sm">
          アサインされている現場がありません。
        </div>

        <div v-if="isAdmin" class="p-portal-index__actions u-mt-4">
          <AppButton variant="secondary" @click="router.push('/portal/admin')">
            ポータル管理画面へ
          </AppButton>
        </div>
      </div>
    </AppPanel>
  </div>
</template>

<style scoped lang="scss">
.p-portal-index {
  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--space-card-gap);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-3);
  }

  &__actions {
    display: flex;
    align-items: center;
  }
}
</style>
