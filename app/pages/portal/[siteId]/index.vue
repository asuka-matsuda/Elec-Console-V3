<script setup lang="ts">
/**
 * 現場トップダッシュボード画面
 * /portal/:siteId
 *
 * @description 指定現場の送電試験進捗サマリー、工程カレンダー、パーソナルToDo、操作ログへアクセスするハブ画面。
 */
import { computed, onMounted, ref } from 'vue'

import { useHead, useNuxtApp, useRoute } from '#app'
import type { CircuitItem } from '#shared/types/circuit'
import { useCurrentSite } from '~/composables/portal/useCurrentSite'
import { useTodo } from '~/composables/portal/useTodo'
import { CircuitsRepository } from '~/utils/db'

const route = useRoute()
const siteId = computed(() => route.params.siteId as string)

const {
  site: currentSite,
  siteOptions,
  switchSite,
} = useCurrentSite(siteId)

const { todos, addTodo, deleteTodo } = useTodo(() => siteId.value)
const newTask = ref('')

const handleAddTodo = () => {
  const text = newTask.value.trim()

  if (!text) return
  addTodo(text)
  newTask.value = ''
}

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
    <header class="flex flex-col gap-item-gap shrink-0">
      <div class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap">
        <h2 class="flex items-center gap-item-gap">
          <Icon name="map-pin" />
          <span>{{ currentSite?.name || '現場ダッシュボード' }}</span>
        </h2>
        <div class="flex items-center gap-item-gap">
          <PortalSyncStatusBadge :site-id="siteId" />

          <Select :model-value="siteId" :options="siteOptions" class="min-w-[200px]" @update:model-value="switchSite" />
        </div>
      </div>
      <hr class="divider">
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-section-gap items-start">
      <section class="min-h-[500px]">
        <ClientOnly>
          <PortalCalendar :site-id="siteId" />
        </ClientOnly>
      </section>

      <aside class="flex flex-col gap-panel-gap">
        <ClientOnly>
          <section class="panel flex flex-col gap-form-row-gap">
            <header class="flex items-center gap-item-gap">
              <h3 class="flex items-center gap-item-gap">
                <Icon name="check" />
                <span>パーソナルToDo</span>
              </h3>
            </header>
            <hr class="divider">

            <form class="flex items-center gap-item-gap" @submit.prevent="handleAddTodo">
              <Input v-model="newTask" placeholder="新しいタスクを入力..." class="flex-1" />
              <Button type="submit" variant="primary" icon="plus" />
            </form>

            <ul v-if="todos.length > 0" class="overflow-y-auto flex flex-col gap-inline-gap max-h-[400px]">
              <li v-for="todo in todos" :key="todo.id" class="todo-item flex items-center justify-between gap-item-gap p-item-gap">
                <Checkbox v-model="todo.completed">
                  <span class="todo-label" :class="{ 'is-completed': todo.completed }">{{ todo.text }}</span>
                </Checkbox>
                <Button variant="danger" size="sm" icon="trash-2" @click="deleteTodo(todo.id)" />
              </li>
            </ul>

            <EmptyState v-else icon="circle-check" variant="cleared" title="タスクはありません" description="上の入力欄から新しいタスクを追加してください。" />
          </section>
        </ClientOnly>

        <nav class="flex flex-col gap-inline-gap">
          <Button icon="zap" block :to="`/portal/${siteId}/souden`">送電試験を開始する</Button>

          <Button icon="sliders" block :to="`/portal/${siteId}/remote-control`">リモコン設定を開く</Button>

          <Button icon="printer" block :to="`/portal/${siteId}/reports`">帳票出力へ移動する</Button>
        </nav>
      </aside>
    </div>
  </div>
</template>

<style scoped lang="scss">
.todo-item {
  background-color: var(--color-bg-hover);
}

.todo-label {
  transition: var(--transition-base);

  &.is-completed {
    text-decoration: line-through;
    opacity: 0.5;
  }
}
</style>
