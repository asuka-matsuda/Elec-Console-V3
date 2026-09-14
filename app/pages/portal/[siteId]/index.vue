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
  <div :key="siteId" class="flex flex-col gap-section-gap h-full">
    <MoleculesSectionHeader
      :title="currentSite?.name || '現場ダッシュボード'"
      icon="map-pin"
      size="lg"
    >
      <template #actions>
        <AtomsSelect
          :model-value="siteId"
          :options="siteOptions"
          class="min-w-[200px]"
          @update:model-value="handleSiteChange"
        />
      </template>
    </MoleculesSectionHeader>

    <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-section-gap items-start">
      <section class="min-h-[500px]">
        <PortalCal :site-id="siteId" />
      </section>

      <aside class="flex flex-col gap-card-gap">
        <PortalPersonalTodo :site-id="siteId" />

        <AtomsButton
          :to="`/portal/${siteId}/souden`"
          variant="primary"
          block
        >
          <AtomsIcon name="zap" />
          送電試験ダッシュボードへ
        </AtomsButton>
      </aside>
    </div>
  </div>
</template>
