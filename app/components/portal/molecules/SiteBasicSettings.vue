<script setup lang="ts">
/**
 * SiteBasicSettings
 * [Portal Molecules] 現場管理の基本情報設定セクション。
 * ステータス、現場ID、現場名、およびアサイン済ワーカーの一覧を提供します。
 */

defineProps<{
  editStatus: string
  editId: string
  name: string
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
    <SectionHeader
      title="現場基本情報"
      icon="info"
      tag="h4"
    />

    <FormGroup label="ステータス">
      <Select
        :model-value="editStatus"
        :options="statusOptions"
        @update:model-value="emit('update:editStatus', String($event ?? ''))"
      />
    </FormGroup>

    <FormGroup label="現場ID (半角英数)">
      <Input
        :model-value="editId"
        placeholder="例: site-tokyo-01"
        @update:model-value="emit('update:editId', String($event ?? ''))"
      />
    </FormGroup>

    <FormGroup label="現場名">
      <Input
        :model-value="name"
        placeholder="例: 新宿プロジェクト"
        @update:model-value="emit('update:name', String($event ?? ''))"
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
