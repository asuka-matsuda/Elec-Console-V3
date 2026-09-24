<script setup lang="ts">
/**
 * 送電ポータルトップ画面
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
const { sites, fetchSites, isLoaded } = useAdminSites()
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
  if (!isLoaded?.value) {
    await fetchSites()
  }
  autoRedirect()
})
</script>

<template>
  <Panel as="section" class="flex flex-col gap-4">
    <SectionHeader title="現場ポータル" variant="hud">
      <template v-if="isAdmin" #actions>
        <Button @click="router.push('/portal/admin')">
          ポータル管理画面へ
        </Button>
      </template>
    </SectionHeader>

    <EmptyState
      icon="folder"
      title="アサインされている現場がありません"
      description="管理者に現場へのアサインを依頼してください。"
    />
  </Panel>
</template>
