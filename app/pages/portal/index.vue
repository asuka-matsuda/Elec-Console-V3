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
  const isMaster = currentUser.value?.loginId === 'master'
  const siteIds = currentUser.value?.assignedSiteIds || []

  // 1. master アカウントは全現場へのアクセス権限を持つため、前回現場または最初の現場へ
  if (isMaster) {
    if (lastSiteId.value && sites.value.some(s => s.id === lastSiteId.value)) {
      router.replace(`/portal/${lastSiteId.value}`)

      return
    }
    const firstSite = sites.value[0]

    if (firstSite) {
      router.replace(`/portal/${firstSite.id}`)

      return
    }
  }

  // 2. 一般ユーザー（非master）はアサイン現場がある場合のみ転送
  if (siteIds.length > 0) {
    const targetSiteId = siteIds.includes(lastSiteId.value)
      ? lastSiteId.value
      : siteIds[0]

    router.replace(`/portal/${targetSiteId}`)

    return
  }

  // 3. アサイン現場がない一般ユーザーはリダイレクトせず、「アサインされている現場がありません」を表示
}

onMounted(async () => {
  if (!isLoaded?.value) {
    await fetchSites()
  }
  autoRedirect()
})
</script>

<template>
  <Panel as="section" class="flex flex-col gap-panel-gap">
    <SectionHeader title="現場ポータル" variant="hud">
      <template v-if="isAdmin" #actions>
        <Button @click="router.push('/portal/admin')">
          現場ポータル管理画面へ
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
