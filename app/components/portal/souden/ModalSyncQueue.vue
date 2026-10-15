<script setup lang="ts">
/**
 * ModalSyncQueue
 * [Organisms] オフライン同期待ちキューの確認・手動同期実行・競合解決を行うモーダルコンポーネント。
 */
import { computed, ref, toRef } from 'vue'

import type { PendingSyncItem, SyncResult } from '~/composables/portal/useOfflineSync'
import { useOfflineSync } from '~/composables/portal/useOfflineSync'
import type { TableColumn } from '~/types/components'
import { formatDateTime } from '~/utils/date'
import type { PhaseDiffItem } from '~/utils/souden'
import { getPhaseDiffItems } from '~/utils/souden'

const isOpen = defineModel<boolean>({ default: false })

const props = defineProps<{
  siteId: string
}>()

const emit = defineEmits<{
  (e: 'synced'): void
}>()

const diffColumns: TableColumn<PhaseDiffItem>[] = [
  { key: 'label', label: '点検・測定項目' },
  { key: 'serverValue', label: 'サーバー側の値' },
  { key: 'clientValue', label: 'あなたの入力 (オフライン)' },
  { key: 'status', label: '状態', width: '60px', align: 'center' },
]

const siteIdRef = toRef(props, 'siteId')
const {
  queue,
  pendingCount,
  isSyncing,
  syncAll,
  resolveConflict,
  resolveAllConflicts,
} = useOfflineSync(siteIdRef)

const syncResult = ref<SyncResult | null>(null)
const isResolving = ref(false)
const conflictItems = computed(() => queue.value.filter(item => item.status === 'conflict'))

const closeModal = () => {
  if (isSyncing.value || isResolving.value) return
  isOpen.value = false
  syncResult.value = null
}

const handleStartSync = async () => {
  syncResult.value = await syncAll()

  if (syncResult.value.successCount > 0) {
    emit('synced')
  }
}

const handleResolve = async (item: PendingSyncItem, resolution: 'overwrite' | 'discard') => {
  if (isResolving.value) return
  isResolving.value = true

  try {
    await resolveConflict(item.id, resolution)
    emit('synced')

    if (queue.value.length === 0) {
      closeModal()
    }
  }
  finally {
    isResolving.value = false
  }
}

const handleResolveAll = async (resolution: 'overwrite' | 'discard') => {
  if (isResolving.value) return
  isResolving.value = true

  try {
    await resolveAllConflicts(resolution)
    emit('synced')

    if (queue.value.length === 0) {
      closeModal()
    }
  }
  finally {
    isResolving.value = false
  }
}
</script>

<template>
  <Modal v-model="isOpen" title="現場データのサーバー同期" @close="closeModal">
    <template #footer>
      <Button :disabled="isResolving || isSyncing" @click="closeModal">閉じる</Button>

      <Button v-if="conflictItems.length === 0 && !syncResult" variant="primary" icon="upload" :loading="isSyncing" :disabled="pendingCount === 0" @click="handleStartSync">変更を送信する</Button>
    </template>

    <div class="flex flex-col gap-panel-gap">

      <template v-if="conflictItems.length > 0">
        <Note variant="warning">
          <strong>{{ conflictItems.length }}件</strong> の回路で別の作業者との更新競合が発生しました。<br>
          差分内容を確認し、どちらの値を採用するか選択してください。
        </Note>

        <div v-if="conflictItems.length > 1" class="panel is-elevated p-panel-pad-compact flex items-center justify-between gap-item-gap">
          <strong>全 {{ conflictItems.length }} 件の一括解決:</strong>
          <div class="flex items-center gap-inline-gap">
            <Button size="sm" variant="secondary" :loading="isResolving" @click="handleResolveAll('discard')">全件サーバー側を維持</Button>
            <Button size="sm" variant="primary" :loading="isResolving" @click="handleResolveAll('overwrite')">全件自分の値で上書き</Button>
          </div>
        </div>

        <div v-for="item in conflictItems" :key="item.id" class="panel p-panel-pad-compact flex flex-col gap-item-gap">
          <div class="flex items-center gap-item-gap">
            <strong>{{ item.banMeisho }}</strong>
            <small class="flex-1">{{ item.kairoBangou }} {{ item.kairoMeisho }}</small>
            <Badge variant="amber">フェーズ{{ item.phase }}</Badge>
          </div>
          <hr class="divider">

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-item-gap">
            <div class="panel is-elevated p-panel-pad-compact flex items-center gap-inline-gap">
              <Icon name="database" size="sm" />
              <small>サーバー側: <time>{{ formatDateTime(item.serverCircuitData?.updatedAt) }}</time></small>
            </div>
            <div class="panel is-elevated p-panel-pad-compact flex items-center gap-inline-gap">
              <Icon name="user" size="sm" />
              <small>オフライン打鍵: <time>{{ formatDateTime(item.clientConfirmedAt) }}</time></small>
            </div>
          </div>

          <Table :columns="diffColumns" :data="getPhaseDiffItems(item.phase, item.serverCircuitData, item.payload)" row-key="key">
            <template #cell-serverValue="{ row: diff }">
              <code>{{ diff.serverValue }}</code>
            </template>
            <template #cell-clientValue="{ row: diff }">
              <strong v-if="diff.isDifferent"><code>{{ diff.clientValue }}</code></strong>
              <code v-else>{{ diff.clientValue }}</code>
            </template>
            <template #cell-status="{ row: diff }">
              <Badge v-if="diff.isDifferent" variant="amber">差異</Badge>
              <small v-else>一致</small>
            </template>
          </Table>

          <hr class="divider">
          <div class="flex items-center justify-end gap-item-gap">
            <Button size="sm" variant="secondary" :disabled="isResolving" @click="handleResolve(item, 'discard')">サーバーの値を残す</Button>
            <Button size="sm" variant="primary" :disabled="isResolving" @click="handleResolve(item, 'overwrite')">自分の値で上書きする</Button>
          </div>
        </div>
      </template>

      <template v-else-if="syncResult">
        <Note :variant="syncResult.errorCount > 0 ? 'error' : 'success'">
          <div class="flex flex-col gap-inline-gap">
            <span v-if="syncResult.successCount > 0">{{ syncResult.successCount }} 件のデータを正常に同期しました。</span>
            <span v-if="syncResult.errorCount > 0">{{ syncResult.errorCount }} 件の送信に失敗しました（電波状況を確認してください）。</span>
          </div>
        </Note>
      </template>

      <template v-else-if="queue.length > 0">
        <p class="field-help-text">
          地下受変電室等で記録された <strong>{{ pendingCount }}件</strong> の未送信データがあります。<br>
          現場で実際に測定された正確な時刻（実打鍵タイムスタンプ）とともにサーバーへ反映します。
        </p>

        <ul class="overflow-y-auto flex flex-col gap-inline-gap max-h-[220px]">
          <li v-for="item in queue" :key="item.id" class="panel is-elevated flex items-center gap-item-gap px-item-gap py-inline-gap">
            <Badge variant="teal">P{{ item.phase }}</Badge>
            <strong>{{ item.banMeisho }}</strong>
            <small class="flex-1">{{ item.kairoBangou }} {{ item.kairoMeisho }}</small>
            <time>{{ formatDateTime(item.clientConfirmedAt) }}</time>
          </li>
        </ul>
      </template>

      <EmptyState v-else icon="circle-check" variant="cleared" title="未送信データはありません" description="すべてのデータがサーバーと正常に同期されています。" />
    </div>
  </Modal>
</template>
