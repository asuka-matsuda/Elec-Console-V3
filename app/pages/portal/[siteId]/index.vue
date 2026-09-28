<script setup lang="ts">
/**
 * 現場トップダッシュボード画面
 * /portal/:siteId
 *
 * @description 指定現場の送電試験進捗サマリー、工程カレンダー、パーソナルToDo、操作ログへアクセスするハブ画面。
 */
import { computed, onMounted } from 'vue'

import { useHead, useNuxtApp, useRoute } from '#app'
import type { CircuitItem } from '#shared/types/circuit'
import { useCurrentSite } from '~/composables/portal/useCurrentSite'
import { CircuitsRepository } from '~/utils/db'

const route = useRoute()
const siteId = computed(() => route.params.siteId as string)

const {
  site: currentSite,
  siteOptions,
  switchSite,
} = useCurrentSite(siteId)

const { $api } = useNuxtApp()

// 現場入室時にバックグラウンドで全回路マスターを IndexedDB へ自動同期（現場オフライン完全担保）
const syncCircuitsBackground = async () => {
  if (!siteId.value || !import.meta.client) return

  try {
    const res = await $api<{ circuits: CircuitItem[] }>(`/api/sites/${siteId.value}/circuits`)

    if (res && res.circuits) {
      await CircuitsRepository.putAll(res.circuits)
    }
  }
  catch {
    // 圏外時はローカルキャッシュをそのまま利用
  }
}

onMounted(() => {
  syncCircuitsBackground()
})

useHead({
  title: computed(() => `${currentSite.value?.name || '現場ダッシュボード'} - Elec-Console`),
})
</script>

<template>
  <div :key="siteId" class="flex flex-col gap-section-gap h-full">
    <SectionHeader
      :title="currentSite?.name || '現場ダッシュボード'"
      icon="map-pin"
    >
      <template #actions>
        <PortalSyncStatusBadge :site-id="siteId" />

        <Select
          :model-value="siteId"
          :options="siteOptions"
          class="min-w-[200px]"
          @update:model-value="switchSite"
        />
      </template>
    </SectionHeader>

    <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-section-gap items-start">
      <section class="min-h-[500px]">
        <ClientOnly>
          <PortalCalendar :site-id="siteId" />
        </ClientOnly>
      </section>

      <aside class="flex flex-col gap-panel-gap">
        <ClientOnly>
          <PortalPersonalTodo :site-id="siteId" />
        </ClientOnly>

        <Button
          icon="zap"
          :to="`/portal/${siteId}/souden`"
          block
        >
          送電試験
        </Button>
      </aside>
    </div>
  </div>
</template>
