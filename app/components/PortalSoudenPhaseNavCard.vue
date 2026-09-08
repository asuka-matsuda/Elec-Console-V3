<script setup lang="ts">
/**
 * PortalSoudenPhaseNavCard
 * 幹線または二次側の各フェーズ（フェーズ1〜3）への遷移ステップ一覧を表示するOrganismコンポーネント。
 */
defineProps<{
  title: string
  icon: string
  variant?: 'hud' | 'tool' | 'management' | 'main'
  siteId: string
  keiTo: '幹線' | '二次側'
  p1Completed: number
  p2Completed: number
  p3Completed: number
  total: number
}>()
</script>

<template>
  <AtomsPanel class="portal-souden-phase-nav-card">
    <AppSectionHeader :title="title" :icon="icon" :variant="variant || 'tool'" />
    <ol class="step-list">
      <PortalSoudenStepIndicator
        :step-num="1"
        title="回路確認・増し締め"
        :completed="p1Completed"
        :total="total"
        :to="`/portal/${siteId}/phase1?kei_to=${keiTo}`"
      />
      <PortalSoudenStepIndicator
        :step-num="2"
        title="絶縁抵抗測定"
        :completed="p2Completed"
        :total="total"
        :to="`/portal/${siteId}/phase2?kei_to=${keiTo}`"
      />
      <PortalSoudenStepIndicator
        :step-num="3"
        title="送電・電圧測定"
        :completed="p3Completed"
        :total="total"
        :to="`/portal/${siteId}/phase3?kei_to=${keiTo}`"
      />
    </ol>
  </AtomsPanel>
</template>

<style scoped lang="scss">
.step-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);

  margin: 0;
  padding: var(--space-2) 0;

  list-style: none;
}
</style>
