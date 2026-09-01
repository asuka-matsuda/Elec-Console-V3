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

const currentSite = computed(() => sites.value.find(s => s.id === siteId.value))

// アサインされている現場のみを抽出
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
  <div
    :key="siteId"
    class="p-site-dashboard"
  >
    <div class="p-site-dashboard__header">
      <div class="p-site-dashboard__title">
        <AppIcon
          name="map-pin"
          class="u-text-muted"
        />
        <h2>{{ currentSite?.name || '現場ダッシュボード' }}</h2>
      </div>
      <div class="p-site-dashboard__switcher">
        <AppSelect
          :model-value="siteId"
          :options="siteOptions"
          class="p-site-dashboard__select"
          @update:model-value="handleSiteChange"
        />
      </div>
    </div>

    <div class="l-grid l-grid--2col-2-1">
      <!-- 2/3: カレンダー -->
      <div class="p-site-dashboard__calendar">
        <Calendar :site-id="siteId" />
      </div>

      <!-- 1/3: ToDo & ボタン -->
      <div class="p-site-dashboard__sidebar">
        <PersonalTodo :site-id="siteId" />

        <NuxtLink
          :to="`/portal/${siteId}/souden`"
          class="c-link-button"
        >
          <AppButton
            variant="primary"
            class="p-site-dashboard__souden-btn"
          >
            <AppIcon
              name="zap"
              size="sm"
            />
            送電試験ダッシュボードへ
          </AppButton>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.p-site-dashboard {
  @include flex-column(var(--space-section-gap));

  height: 100%;

  &__header {
    @include flex-between;

    padding-bottom: var(--space-card-pad-sm);
    border-bottom: var(--border-width-base) solid var(--color-border);
  }

  &__title {
    @include flex-start(var(--space-inline-gap));

    h2 {
      @include text-title("lg");

      color: var(--color-text-main);
    }
  }

  &__switcher {
    @include flex-start(var(--space-inline-gap));
  }

  &__select {
    min-width: 200px;
  }

  &__calendar {
    min-height: 500px; // カレンダーが潰れないように
  }

  &__sidebar {
    @include flex-column(var(--space-card-gap));
  }

  &__souden-btn {
    width: 100%;
  }
}

.c-link-button {
  display: block;
}

.l-grid--2col-2-1 {
  @include grid(2fr 1fr, var(--space-section-gap));

  align-items: flex-start;

  @include mq("lg") {
    grid-template-columns: 1fr;
  }
}
</style>
