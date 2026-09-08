<script setup lang="ts">
/**
 * PortalSiteBasicTab
 * 現場設定モーダル - 基本設定タブOrganismコンポーネント。
 * ステータス、現場ID、現場名、およびアサイン済ワーカー一覧を管理します。
 */
import type { SelectOption } from '~/types/components'

const editStatus = defineModel<string>('status', { default: 'in_progress' })
const editId = defineModel<string>('siteId', { default: '' })
const editName = defineModel<string>('name', { default: '' })

defineProps<{
  statusOptions: SelectOption[]
  workerNames: string[]
}>()
</script>

<template>
  <div class="portal-site-basic-tab">
    <AppFormGroup label="ステータス">
      <AppSelect v-model="editStatus" :options="statusOptions" />
    </AppFormGroup>

    <AppFormGroup label="現場ID (半角英数)">
      <AppInput v-model="editId" placeholder="例: site-tokyo-01" />
    </AppFormGroup>

    <AppFormGroup label="現場名">
      <AppInput v-model="editName" />
    </AppFormGroup>

    <AppFormGroup label="アサイン済ワーカー">
      <div class="portal-site-basic-tab__workers">
        <template v-if="workerNames.length > 0">
          <AtomsBadge
            v-for="(name, idx) in workerNames"
            :key="idx"
            color="var(--color-category-main)"
          >
            {{ name }}
          </AtomsBadge>
        </template>
        <AppEmptyState
          v-else
          icon="users"
          title="アサインされているワーカーはいません"
          description="管理者よりワーカーをアサインしてください。"
        />
      </div>
    </AppFormGroup>
  </div>
</template>

<style scoped lang="scss">
.portal-site-basic-tab {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  &__workers {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
  }
}
</style>
