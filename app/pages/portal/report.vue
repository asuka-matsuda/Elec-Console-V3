<script setup lang="ts">
import { useHead } from '#app';
import AppPanel from '~/components/ui/AppPanel.vue';
import AppCard from '~/components/ui/AppCard.vue';
import AppButton from '~/components/ui/AppButton.vue';

useHead({ title: '帳票出力 - Elec-Console' });
</script>

<template>
  <div class="p-portal-report">
    <AppPanel heading="帳票・レポート出力" icon="file-text">
      <p class="p-portal-report__desc">
        各種試験結果や進捗状況をExcel・PDF形式で出力します。
      </p>

      <div class="p-portal-report__grid">
        <AppCard>
          <template #header>試験結果報告書 (Phase 1-3)</template>
          <p class="p-portal-report__card-desc">全フェーズの試験結果をまとめた公式な報告書を出力します。</p>
          <template #footer>
            <div class="p-portal-report__actions">
              <AppButton variant="primary" icon="download">Excel出力</AppButton>
              <AppButton variant="secondary" icon="printer">PDF出力</AppButton>
            </div>
          </template>
        </AppCard>

        <AppCard>
          <template #header>総合進捗一覧</template>
          <p class="p-portal-report__card-desc">現在の回路ごとのステータス一覧を出力します。</p>
          <template #footer>
            <AppButton variant="primary" icon="download">CSV出力</AppButton>
          </template>
        </AppCard>
      </div>
    </AppPanel>
  </div>
</template>

<style scoped lang="scss">
.p-portal-report {
  &__desc {
    margin-bottom: 1.5rem;
    color: var(--color-text-muted, #4b5563);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 1rem;
    
    @media (min-width: 768px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  &__card-desc {
    font-size: 0.875rem;
    color: var(--color-text-muted, #6b7280);
    margin-bottom: 1rem;
  }

  &__actions {
    display: flex;
    gap: 0.5rem;
  }
}
</style>