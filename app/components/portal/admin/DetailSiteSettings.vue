<script setup lang="ts">
/**
 * DetailSiteSettings
 * [Portal Organisms] 現場管理の右ペイン（詳細設定コンソール）
 * 選択された現場の基本情報、Excelデータ連携、除外回路ルールを統合提供します。
 */
import { computed, reactive, ref, watch } from 'vue'

import { useAdminUsers } from '~/composables/admin/useAdminUsers'
import { SITE_SETTINGS_TABS, SITE_STATUS_OPTIONS } from '~/constants/adminConstants'
import type { Site } from '~/types/admin'
import { getAssignedWorkerNames } from '~/utils/portal'

const props = defineProps<{
  site: Site | null
  isSaving?: boolean
  isDeleting?: boolean
}>()

const emit = defineEmits<{
  save: [payload: Site]
  delete: [site: Site]
}>()

const activeTab = ref('basic')
const { users, fetchUsers } = useAdminUsers()

// 単一のリアクティブオブジェクトに集約（断片化と余計なcomputedラッパーを全廃）
const form = reactive({
  name: '',
  status: 'planning' as Site['status'],
  excludedCircuits: [] as string[],
  noBreakWords: [] as string[],
})

watch(
  () => props.site,
  async (newSite) => {
    if (newSite) {
      form.name = newSite.name || ''
      form.status = newSite.status || 'planning'
      form.excludedCircuits = [...(newSite.excludedCircuits || [])]
      form.noBreakWords = [...(newSite.noBreakWords || [])]

      if (users.value.length === 0) {
        await fetchUsers()
      }
    }
  },
  { immediate: true },
)

const workerNames = computed(() =>
  getAssignedWorkerNames(props.site?.id, users.value),
)

const handleAddExcludedCircuit = () => {
  form.excludedCircuits.push('')
}

const handleRemoveExcludedCircuit = (index: number) => {
  form.excludedCircuits.splice(index, 1)
}

const handleUpdateExcludedCircuit = (index: number, val: string | number | null | undefined) => {
  form.excludedCircuits[index] = String(val ?? '')
}

const handleAddNoBreakWord = () => {
  form.noBreakWords.push('')
}

const handleRemoveNoBreakWord = (index: number) => {
  form.noBreakWords.splice(index, 1)
}

const handleUpdateNoBreakWord = (index: number, val: string | number | null | undefined) => {
  form.noBreakWords[index] = String(val ?? '')
}

const handleSave = () => {
  if (!props.site) return

  const parsedCircuits = form.excludedCircuits
    .map(c => c.trim())
    .filter(c => c.length > 0)

  const parsedWords = form.noBreakWords
    .map(w => w.trim())
    .filter(w => w.length > 0)

  emit('save', {
    ...props.site,
    name: form.name.trim(),
    status: form.status,
    excludedCircuits: parsedCircuits,
    noBreakWords: parsedWords,
  })
}
</script>

<template>
  <div class="flex flex-col gap-6 w-full">

    <EmptyState
      v-if="!site"
      icon="layout"
      title="現場が選択されていません"
      description="左側の現場一覧から、設定やデータ連携を行う現場を選択してください。"
      class="placeholder-empty min-h-[400px] flex items-center justify-center"
    />

    <template v-else>

      <SectionHeader icon="settings">
        <template #default>
          <div class="flex items-baseline gap-2">
            <span>{{ site.name }}</span>
            <span class="site-id">
              (ID: {{ site.id }})
            </span>
          </div>
        </template>

        <template #actions>
          <div class="flex items-center gap-2">
            <Button
              variant="danger"
              icon="trash-2"
              :loading="isDeleting"
              @click="emit('delete', site)"
            >
              削除
            </Button>
            <Button
              variant="success"
              icon="save"
              :loading="isSaving"
              @click="handleSave"
            >
              変更を保存
            </Button>
          </div>
        </template>
      </SectionHeader>

      <Tabs
        v-model="activeTab"
        :options="SITE_SETTINGS_TABS"
      >

        <template #basic>
          <div class="flex flex-col gap-5 max-w-xl">
            <SectionHeader
              title="現場基本情報"
              icon="info"
              tag="h4"
            />

            <FormGroup label="現場ID (変更不可)">
              <Input
                :model-value="site.id"
                disabled
              />
            </FormGroup>

            <FormGroup label="現場名">
              <Input
                v-model="form.name"
                placeholder="例: 新宿プロジェクト"
              />
            </FormGroup>

            <FormGroup label="ステータス">
              <Select
                v-model="form.status"
                :options="SITE_STATUS_OPTIONS"
                :clearable="false"
              />
            </FormGroup>

            <FormGroup label="アサイン済作業者">
              <div
                v-if="workerNames.length > 0"
                class="flex flex-wrap items-center gap-2"
              >
                <Badge
                  v-for="worker in workerNames"
                  :key="worker"
                >
                  {{ worker }}
                </Badge>
              </div>
              <EmptyState
                v-else
                icon="users"
                title="アサインされている作業者はいません"
                description="ユーザー管理画面から作業者をアサインしてください。"
              />
            </FormGroup>
          </div>
        </template>

        <template #integration>
          <PortalTabSiteExcelIntegration :site="site" />
        </template>

        <template #rules>
          <div class="flex flex-col gap-4 max-w-xl">
            <SectionHeader
              title="除外回路の設定"
              icon="slash"
              tag="h4"
            />
            <p class="desc-text m-0">
              計算や試験連携の対象外とする盤・回路を指定します。
            </p>

            <ul
              v-if="form.excludedCircuits.length > 0"
              class="m-0 flex flex-col gap-2 p-0 list-none"
            >
              <li
                v-for="(circuit, idx) in form.excludedCircuits"
                :key="idx"
                class="flex items-center gap-2"
              >
                <Input
                  :model-value="circuit"
                  placeholder="例: 盤A-回路1"
                  @update:model-value="handleUpdateExcludedCircuit(idx, $event)"
                />
                <Button
                  icon="trash-2"
                  variant="danger"
                  @click="handleRemoveExcludedCircuit(idx)"
                />
              </li>
            </ul>

            <EmptyState
              v-else
              icon="slash"
              title="除外回路は設定されていません"
              description="すべての回路が計算・連携の対象となります。"
            />

            <Button
              icon="plus"
              class="w-fit"
              @click="handleAddExcludedCircuit"
            >
              除外回路を追加する
            </Button>
          </div>
        </template>

        <template #wordBreak>
          <div class="flex flex-col gap-4 max-w-xl">
            <SectionHeader
              title="改行禁止ワードの設定"
              icon="type"
              tag="h4"
            />
            <p class="desc-text m-0">
              テーブルの盤名称等で途中で改行させない単語を指定します（※「1-1」等の英数字ハイフンや「分電盤」等はシステムで自動処理されます）。
            </p>

            <ul
              v-if="form.noBreakWords.length > 0"
              class="m-0 flex flex-col gap-2 p-0 list-none"
            >
              <li
                v-for="(word, idx) in form.noBreakWords"
                :key="idx"
                class="flex items-center gap-2"
              >
                <Input
                  :model-value="word"
                  placeholder="例: 自動倉庫, 受変電設備"
                  @update:model-value="handleUpdateNoBreakWord(idx, $event)"
                />
                <Button
                  icon="trash-2"
                  variant="danger"
                  @click="handleRemoveNoBreakWord(idx)"
                />
              </li>
            </ul>

            <EmptyState
              v-else
              icon="type"
              title="改行禁止ワードは設定されていません"
              description="現場固有の単語を追加すると、テーブル内で途中で改行されなくなります。"
            />

            <Button
              icon="plus"
              class="w-fit"
              @click="handleAddNoBreakWord"
            >
              改行禁止ワードを追加する
            </Button>
          </div>
        </template>
      </Tabs>
    </template>
  </div>
</template>

<style scoped>
.site-id {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.desc-text {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-base);
  color: var(--color-text-muted);
}
</style>
