<script setup lang="ts">
import { onMounted } from 'vue';
import PortalExamLayout from '~/components/portal/PortalExamLayout.vue';
import PortalExamRowActions from '~/components/portal/PortalExamRowActions.vue';
import AppKairoIcon from '~/components/portal/AppKairoIcon.vue';
import AppTable from '~/components/ui/AppTable.vue';
import AppButton from '~/components/ui/AppButton.vue';
import AppBadge from '~/components/ui/AppBadge.vue';
import AppInput from '~/components/ui/AppInput.vue';
import { usePhaseData } from '~/composables/portal/usePhaseData';
import { EXAM_STATUS } from '~/utils/constants/portal';
import type { ExamStatus, ExamRowPhase23 } from '~/types/portal';

const props = defineProps<{
  phase: 1 | 2 | 3;
  title: string;
  icon: string;
  headers: any[];
  unit?: string;
}>();

const { rows, fetchRows, updateRowStatus } = usePhaseData(props.phase);

onMounted(() => {
  fetchRows();
});
</script>

<template>
  <PortalExamLayout 
    :title="title" 
    :icon="icon"
  >
    <template #summary>
      全 150 回路中、一部完了
    </template>
    <template #actions>
      <AppButton variant="primary" size="sm" icon="save">一括保存</AppButton>
    </template>
    
    <template #table>
      <AppTable :columns="headers" :data="rows">
        <template #cell-kairo_kigou="{ value }">
          <AppKairoIcon :type="value as string" />
        </template>
        
        <template #cell-result_value="{ row }">
          <div v-if="phase === 2 || phase === 3" class="p-portal-exam-input">
            <AppInput 
              v-model="(row as ExamRowPhase23).result_value" 
              type="number" 
              placeholder="測定値"
              size="sm"
            />
            <span class="p-portal-exam-input__unit">{{ unit }}</span>
          </div>
        </template>
        
        <template #cell-status="{ value }">
          <AppBadge v-if="value === EXAM_STATUS.PASSED" variant="success">合格</AppBadge>
          <AppBadge v-else-if="value === EXAM_STATUS.FAILED" variant="danger">不良</AppBadge>
          <AppBadge v-else variant="neutral">{{ value }}</AppBadge>
        </template>
        
        <template #cell-actions="{ row }">
          <PortalExamRowActions 
            :status="row.status as string" 
            @update-status="(s: string) => updateRowStatus(row.id as string, s as ExamStatus)" 
          />
        </template>
      </AppTable>
    </template>
  </PortalExamLayout>
</template>

<style scoped lang="scss">
.p-portal-exam-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  max-width: 150px;

  &__unit {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }
}
</style>
