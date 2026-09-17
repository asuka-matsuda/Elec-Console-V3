<script setup lang="ts">
/**
 * MoleculesSiteBasicSettings
 * [Portal Molecules] 現場管理の基本情報設定セクション。
 * ステータス、現場ID、現場名、およびアサイン済ワーカーの一覧を提供します。
 */
import type { Site } from '~/types/admin'

defineProps<{
  editStatus: string
  editId: string
  editData: Partial<Site>
  statusOptions: { label: string, value: string }[]
  workerNames: string[]
}>()

const emit = defineEmits<{
  'update:editStatus': [val: string]
  'update:editId': [val: string]
  'update:name': [val: string]
}>()
</script>

<template>
  <div class="flex flex-col gap-5 max-w-xl">
    <MoleculesSectionHeader
      title="現場基本情報"
      icon="info"
      size="sm"
    />

    <MoleculesFormGroup label="ステータス">
      <AtomsSelect
        :model-value="editStatus"
        :options="statusOptions"
        @update:model-value="emit('update:editStatus', String($event ?? ''))"
      />
    </MoleculesFormGroup>

    <MoleculesFormGroup label="現場ID (半角英数)">
      <AtomsInput
        :model-value="editId"
        placeholder="例: site-tokyo-01"
        @update:model-value="emit('update:editId', String($event ?? ''))"
      />
    </MoleculesFormGroup>

    <MoleculesFormGroup label="現場名">
      <AtomsInput
        :model-value="editData.name"
        placeholder="例: 新宿プロジェクト"
        @update:model-value="emit('update:name', String($event ?? ''))"
      />
    </MoleculesFormGroup>

    <MoleculesFormGroup label="アサイン済作業者">
      <div class="flex flex-wrap items-center gap-2">
        <template v-if="workerNames.length > 0">
          <Badge
            v-for="(name, idx) in workerNames"
            id="site:worker-tag"
            :key="idx"
          >
            {{ name }}
          </Badge>
        </template>
        <MoleculesEmptyState
          v-else
          icon="users"
          title="アサインされている作業者はいません"
          description="ユーザー管理画面から作業者をアサインしてください。"
        />
      </div>
    </MoleculesFormGroup>
  </div>
</template>
