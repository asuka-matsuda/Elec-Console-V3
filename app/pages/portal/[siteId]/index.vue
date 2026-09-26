<script setup lang="ts">
/**
 * 現場トップダッシュボード画面
 * /portal/:siteId
 *
 * @description 指定現場の送電試験進捗サマリー、工程カレンダー、パーソナルToDo、操作ログへアクセスするハブ画面。
 */
import { computed } from 'vue'

import { useHead, useRoute } from '#app'
import { useCurrentSite } from '~/composables/portal/useCurrentSite'

const route = useRoute()
const siteId = computed(() => route.params.siteId as string)

const {
  site: currentSite,
  siteOptions,
  switchSite,
} = useCurrentSite(siteId)

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
