<script setup lang="ts">
/**
 * SyncStatusBadge
 * [Portal Molecules] オフライン同期状態（未同期件数／同期済）を表示し、クリックで同期モーダルを開く。
 */
import { ref, toRef } from 'vue'

import { useOfflineSync } from '~/composables/portal/useOfflineSync'

const props = defineProps<{
  siteId: string
}>()

const {
  pendingCount,
  hasPending,
  isSyncing,
} = useOfflineSync(toRef(props, 'siteId'))

const isModalOpen = ref(false)
</script>

<template>
  <div class="inline-flex items-center">
    <Button v-if="hasPending" variant="warning" size="sm" :icon="isSyncing ? 'refresh-cw' : 'zap'" suffix-icon="upload" :loading="isSyncing" @click="isModalOpen = true">
      未同期 {{ pendingCount }}件 同期実行
    </Button>

    <Badge v-else variant="green" size="sm">同期済</Badge>

    <PortalModalSyncQueue v-if="isModalOpen" v-model="isModalOpen" :site-id="siteId" />
  </div>
</template>
