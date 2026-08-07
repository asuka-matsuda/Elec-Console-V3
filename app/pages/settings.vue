<script setup lang="ts">
import { useSettings } from '~/composables/useSettings'

const { themeMode, baseBgStyle } = useSettings()

const themeOptions = [
  { label: 'ダークモード (標準)', value: 'dark' },
  { label: 'ライトモード', value: 'light' },
]

const bgOptions = [
  { label: 'オーロラ (標準)', value: 'aurora' },
  { label: 'グラデーション', value: 'gradient' },
  { label: 'サイバーグリッド', value: 'grid' },
  { label: '単色', value: 'solid' },
]
</script>

<template>
  <div class="p-settings">
    <header class="p-settings__header">
      <AppSectionHeader 
        title="UI・個人設定" 
        icon="settings" 
        variant="tool"
        size="lg"
      />
      <p class="p-settings__desc">このブラウザ固有のUI設定をカスタマイズします。</p>
    </header>

    <div class="p-settings__grid">
      <div class="p-settings__stack">
        <!-- エフェクト設定 -->
        <AppPanel title="エフェクト設定" variant="hybrid" bracketColor="tool">
          <template #header>
            <AppSectionHeader title="エフェクト設定" icon="monitor" variant="tool" size="md" />
          </template>
          
          <p class="u-text-sm u-text-muted">
            画面の演出効果を切り替えることができます。動作が重い場合はシンプルなものに変更してください。
          </p>

          <AppFormGroup 
            label="ベース背景スタイル" 
            help="下地となる背景の柄を変更します"
          >
            <AppSelect 
              v-model="baseBgStyle"
              :options="bgOptions"
            />
          </AppFormGroup>
        </AppPanel>

        <!-- テーマ・カラー設定 -->
        <AppPanel title="テーマ・カラー設定" variant="hybrid" bracketColor="tool">
          <template #header>
            <AppSectionHeader title="テーマ・カラー設定" icon="moon" variant="tool" size="md" />
          </template>
          
          <p class="u-text-sm u-text-muted">
            画面のテーマ（ライト/ダーク）を変更します。
          </p>

          <AppFormGroup 
            label="外観モード" 
            help="全体の明るさを変更します（ダークモード推奨）"
          >
            <AppSelect 
              v-model="themeMode"
              :options="themeOptions"
            />
          </AppFormGroup>
        </AppPanel>
      </div>

      <!-- 右側は将来の拡張用に空けておく -->
      <div class="p-settings__side"></div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.p-settings {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding-bottom: var(--space-8);

  &__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__desc {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    margin-top: var(--space-2);
  }

  &__grid {
    display: grid;
    grid-template-columns: 2fr 1fr; // Desktop default
    gap: var(--space-8);
    
    @include mq('lg') {
      grid-template-columns: 1fr;
    }
  }

  &__stack {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
  }
}

// Utility classes for temporary use
.u-text-sm { font-size: var(--text-sm); }
.u-text-muted { color: var(--color-text-muted); }
</style>
