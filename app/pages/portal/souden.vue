<script setup lang="ts">
import { useHead } from '#app';
import AppPanel from '~/components/ui/AppPanel.vue';
import AppCard from '~/components/ui/AppCard.vue';
import AppButton from '~/components/ui/AppButton.vue';
import AppIcon from '~/components/ui/AppIcon.vue';

useHead({
  title: '送電ダッシュボード - Elec-Console'
});
</script>

<template>
  <div class="p-portal-souden l-stack l-stack--lg">
    <div class="c-section-header">
      <h2 class="c-section-header__title">
        <AppIcon name="activity" /> 総合進捗・送電ダッシュボード
      </h2>
      <div class="c-section-header__actions">
        <AppButton variant="primary" size="sm" icon="file-text" href="/portal/report">
          試験結果の印刷
        </AppButton>
      </div>
    </div>

    <div class="p-portal-souden__cards">
      <AppCard>
        <template #header>Phase 1: 盤内チェック</template>
        <div class="p-portal-souden__card-value">80%</div>
        <div class="p-portal-souden__card-desc">120 / 150 回路</div>
        <template #footer>
          <AppButton variant="secondary" block href="/portal/phase1">Phase 1 を入力</AppButton>
        </template>
      </AppCard>

      <AppCard>
        <template #header>Phase 2: 絶縁抵抗測定</template>
        <div class="p-portal-souden__card-value">45%</div>
        <div class="p-portal-souden__card-desc">68 / 150 回路</div>
        <template #footer>
          <AppButton variant="secondary" block href="/portal/phase2">Phase 2 を入力</AppButton>
        </template>
      </AppCard>

      <AppCard>
        <template #header>Phase 3: 電圧測定</template>
        <div class="p-portal-souden__card-value">10%</div>
        <div class="p-portal-souden__card-desc">15 / 150 回路</div>
        <template #footer>
          <AppButton variant="secondary" block href="/portal/phase3">Phase 3 を入力</AppButton>
        </template>
      </AppCard>
    </div>

    <AppPanel heading="ポータルメニュー" icon="grid">
      <div class="p-portal-souden__menu">
        <AppButton icon="calendar" href="/portal/calendar">現場カレンダー</AppButton>
        <AppButton icon="check-square" href="/portal/completed_todos">完了済みTODO</AppButton>
        <AppButton icon="list" href="/portal/operation_logs">操作ログ</AppButton>
        <AppButton icon="settings" href="/portal/admin">ポータル管理</AppButton>
      </div>
    </AppPanel>
  </div>
</template>

<style scoped lang="scss">
.p-portal-souden {
  &__cards {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 1rem;
    
    @media (min-width: 768px) {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  &__card-value {
    font-size: 1.5rem;
    font-weight: bold;
    text-align: center;
    padding: 1rem 0;
  }

  &__card-desc {
    font-size: 0.875rem;
    text-align: center;
    color: var(--color-text-muted, #6b7280);
  }

  &__menu {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
}
</style>