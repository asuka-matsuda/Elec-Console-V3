<script setup lang="ts">
/**
 * Portal Index
 * 現場ポータルのトップ（現場選択など）
 */
import { useLocalStorage } from '@vueuse/core'
import { onMounted } from 'vue'

import { useHead, useRouter } from '#app'
import { useAuth } from '~/composables/useAuth'

useHead({ title: '現場ポータル - Elec-Console' })
const router = useRouter()
const { isAdmin, currentUser } = useAuth()
const lastSiteId = useLocalStorage('last-accessed-site', '')

onMounted(() => {
  const siteIds = currentUser.value?.assignedSiteIds || []

  if (siteIds.length > 0) {
    const targetSiteId = siteIds.includes(lastSiteId.value) ? lastSiteId.value : siteIds[0]

    router.replace(`/portal/${targetSiteId}`)
  }
  else if (lastSiteId.value) {
    router.replace(`/portal/${lastSiteId.value}`)
  }
})
</script>

<template>
  <div class="p-portal-index">
    <AppPanel
      title="現場ポータル (仮)"
      variant="hud"
    >
      <div class="p-portal-index__content">
        <p>ここは現場ポータルのトップ画面です。</p>
        <p>（本来は、アサインされている現場の一覧や、各現場のダッシュボードへのリンクが表示される予定です）</p>

        <div
          v-if="isAdmin"
          class="p-portal-index__actions"
        >
          <AppButton
            variant="secondary"
            @click="router.push('/portal/admin')"
          >
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
    @include flex-start-stretch($direction: column);

    gap: var(--space-card-gap);
  }

  &__actions {
    @include flex-start-center;
  }
}
</style>
