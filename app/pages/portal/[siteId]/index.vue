<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import { computed, onMounted, watch } from 'vue'

import { useHead, useRoute, useRouter } from '#app'
import PortalCal from '~/components/PortalCal.client.vue'
import PortalPersonalTodo from '~/components/PortalPersonalTodo.client.vue'
import { useAdminSites } from '~/composables/admin/useAdminSites'
import { useAuth } from '~/composables/useAuth'
import { STORAGE_KEYS } from '~/constants/storageKeys'

const route = useRoute()
const router = useRouter()
const siteId = computed(() => route.params.siteId as string)

const { sites, fetchSites } = useAdminSites()
const { currentUser } = useAuth()

const lastSiteId = useLocalStorage(STORAGE_KEYS.LAST_SITE_ID, '')

watch(
  siteId,
  (newId) => {
    if (newId) {
      lastSiteId.value = newId
    }
  },
  { immediate: true },
)

const currentSite = computed(() =>
  sites.value.find(s => s.id === siteId.value),
)

useHead({
  title: computed(() => `${currentSite.value?.name || '現場ダッシュボード'} - Elec-Console`),
})

const assignedSites = computed(() => {
  const ids = currentUser.value?.assignedSiteIds || []

  return sites.value.filter(s => ids.includes(s.id))
})

const siteOptions = computed(() =>
  assignedSites.value.map(s => ({ value: s.id, label: s.name })),
)

const handleSiteChange = (newSiteId: unknown) => {
  const targetId = String(newSiteId)

  if (!targetId || targetId === siteId.value) return
  router.push(`/portal/${targetId}`)
}

onMounted(() => {
  if (sites.value.length === 0) {
    fetchSites()
  }
})
</script>

<template>
  <div :key="siteId" class="site-dashboard">
    <AppSectionHeader
      :title="currentSite?.name || '現場ダッシュボード'"
      icon="map-pin"
      size="lg"
    >
      <template #actions>
        <AppSelect
          :model-value="siteId"
          :options="siteOptions"
          class="site-dashboard__select"
          @update:model-value="handleSiteChange"
        />
      </template>
    </AppSectionHeader>

    <div class="site-dashboard__grid">
      <section class="site-dashboard__calendar" aria-label="現場スケジュール">
        <PortalCal :site-id="siteId" />
      </section>

      <aside class="site-dashboard__sidebar" aria-label="現場関連機能">
        <PortalPersonalTodo :site-id="siteId" />

        <AtomsButton
          :to="`/portal/${siteId}/souden`"
          variant="primary"
          block
        >
          <AtomsIcon name="zap" size="sm" />
          送電試験ダッシュボードへ
        </AtomsButton>
      </aside>
    </div>
  </div>
</template>

<style scoped lang="scss">
.site-dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-section-gap);
  height: 100%;

  &__select {
    min-width: 200px;
  }

  &__grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--space-section-gap);
    align-items: flex-start;

    @include mq("lg") {
      grid-template-columns: 1fr;
    }
  }

  &__calendar {
    min-height: 500px;
  }

  &__sidebar {
    display: flex;
    flex-direction: column;
    gap: var(--space-card-gap);
  }
}
</style>
