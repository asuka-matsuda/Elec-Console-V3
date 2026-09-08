<script setup lang="ts">
/**
 * Portal Index
 * 現場ポータルのトップ（未アサイン時の案内・自動リダイレクト）
 */
import { useLocalStorage } from '@vueuse/core'
import { onMounted } from 'vue'

import { useHead, useRouter } from '#app'
import { useAdminSites } from '~/composables/admin/useAdminSites'
import { useAuth } from '~/composables/useAuth'
import { STORAGE_KEYS } from '~/constants/storageKeys'

useHead({ title: '現場ポータル - Elec-Console' })
const router = useRouter()
const { isAdmin, currentUser } = useAuth()
const { sites, fetchSites } = useAdminSites()
const lastSiteId = useLocalStorage(STORAGE_KEYS.LAST_SITE_ID, '')

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
  <AtomsPanel class="flex flex-col gap-4">
    <MoleculesSectionHeader title="現場ポータル" variant="hud">
      <template v-if="isAdmin" #actions>
        <AtomsButton variant="secondary" size="sm" @click="router.push('/portal/admin')">
          ポータル管理画面へ
        </AtomsButton>
      </template>
    </MoleculesSectionHeader>

    <AppEmptyState
      icon="folder"
      title="アサインされている現場がありません"
      description="管理者に現場へのアサインを依頼してください。"
    />
  </AtomsPanel>
</template>
