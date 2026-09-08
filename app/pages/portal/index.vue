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
  <AppPanel class="portal-index">
    <AppSectionHeader title="現場ポータル" variant="hud">
      <template v-if="isAdmin" #actions>
        <AtomsButton variant="secondary" size="sm" @click="router.push('/portal/admin')">
          ポータル管理画面へ
        </AtomsButton>
      </template>
    </AppSectionHeader>

    <p class="u-text-muted">
      アクセスする現場ポータルを選択してください。
    </p>

    <div v-if="availableSites.length > 0" class="portal-index__grid">
      <MenuTile
        v-for="site in availableSites"
        :key="site.id"
        :title="site.name"
        :to="`/portal/${site.id}`"
        icon="folder"
      >
        <template #badge>
          <AtomsBadge :color="site.status === 'in_progress' ? 'var(--color-status-success)' : 'var(--color-status-neutral)'">
            {{ site.status === 'in_progress' ? '進行中' : '準備中' }}
          </AtomsBadge>
        </template>
        <div class="u-text-xs u-text-muted">
          現場ID: {{ site.id }}
        </div>
      </MenuTile>
    </div>

    <AppEmptyState
      v-else
      icon="folder"
      title="アサインされている現場がありません"
      description="管理者に現場へのアサインを依頼してください。"
    />
  </AppPanel>
</template>

<style scoped lang="scss">
.portal-index {
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-3);
  }
}
</style>
