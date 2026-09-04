<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import { computed, onMounted, watch } from 'vue'

import { useRoute, useRouter } from '#app'
import Calendar from '~/components/Portal/Calendar.client.vue'
import PersonalTodo from '~/components/Portal/PersonalTodo.client.vue'
import { useAdminSites } from '~/composables/admin/useAdminSites'
import { useAuth } from '~/composables/useAuth'

const route = useRoute()
const router = useRouter()
const siteId = computed(() => route.params.siteId as string)

const { sites, fetchSites } = useAdminSites()
const { currentUser } = useAuth()

const lastSiteId = useLocalStorage('last-accessed-site', '')

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
  <div :key="siteId" class="p-site-dashboard">
    <AppSectionHeader
      :title="currentSite?.name || '現場ダッシュボード'"
      icon="map-pin"
      size="lg"
    >
      <template #actions>
        <AppSelect
          :model-value="siteId"
          :options="siteOptions"
          class="p-site-dashboard__select"
          @update:model-value="handleSiteChange"
        />
      </template>
    </AppSectionHeader>

    <div class="l-grid l-grid--2col-2-1">
      <div class="p-site-dashboard__calendar">
        <Calendar :site-id="siteId" />
      </div>

      <div class="p-site-dashboard__sidebar">
        <PersonalTodo :site-id="siteId" />

        <AppButton
          :to="`/portal/${siteId}/souden`"
          variant="primary"
          block
        >
          <AppIcon name="zap" size="sm" />
          送電試験ダッシュボードへ
        </AppButton>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.p-site-dashboard {
  @include flex-start-stretch($direction: column);

  gap: var(--space-section-gap);
  height: 100%;

  &__select {
    min-width: 200px;
  }

  &__calendar {
    min-height: 500px;
  }

  &__sidebar {
    @include flex-start-stretch($direction: column);

    gap: var(--space-card-gap);
  }
}

.l-grid--2col-2-1 {
  @include grid(2fr 1fr, var(--space-section-gap));

  align-items: flex-start;

  @include mq("lg") {
    grid-template-columns: 1fr;
  }
}
</style>
