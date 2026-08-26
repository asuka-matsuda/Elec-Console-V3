<script setup lang="ts">
/**
 * Portal Index
 * 現場ポータルのトップ（現場選択など）
 */
import { useHead, useRouter } from '#app';
import AppPanel from '~/components/ui/AppPanel.vue';
import AppButton from '~/components/ui/AppButton.vue';
import { useAuth } from '~/composables/useAuth';

useHead({ title: '現場ポータル - Elec-Console' });
const router = useRouter();
const { isAdmin } = useAuth();
</script>

<template>
  <div class="p-portal-index" style="padding: var(--pad-container)">
    <AppPanel title="現場ポータル (仮)" variant="hud">
      <div class="p-portal-index__stack">
        <p>ここは現場ポータルのトップ画面です。</p>
        <p>（本来は、アサインされている現場の一覧や、各現場のダッシュボードへのリンクが表示される予定です）</p>
        
        <div style="margin-top: var(--gap-section)">
          <AppButton v-if="isAdmin" variant="secondary" @click="router.push('/portal/admin')">
            ポータル管理画面へ
          </AppButton>
        </div>
      </div>
    </AppPanel>
  </div>
</template>
