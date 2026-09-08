<script setup lang="ts">
/**
 * Settings
 * UIや個人の設定を行う画面のコンポーネントです。テーマや背景エフェクトなどのカスタマイズ機能を提供します。
 */
import { useSettings } from '~/composables/useSettings'
import { THEME_OPTIONS } from '~/constants/constants'

useHead({
  title: 'UI・個人設定',
})

const { themeMode } = useSettings()
</script>

<template>
  <div class="settings-view">
    <MoleculesSectionHeader
      title="UI・個人設定"
      icon="settings"
      variant="tool"
      size="lg"
    />
    <p class="description">
      このブラウザ固有のUI設定をカスタマイズします。
    </p>

    <div class="settings-content">
      <AtomsPanel class="flex flex-col gap-4">
        <MoleculesSectionHeader
          title="テーマ・カラー設定"
          icon="moon"
          variant="tool"
          size="md"
        />

        <p class="description">
          画面のテーマ（ライト/ダーク）を変更します。
        </p>

        <MoleculesFormGroup
          label="外観モード"
          help="全体の明るさを変更します（ダークモード推奨）"
        >
          <AtomsSelect v-model="themeMode" :options="THEME_OPTIONS" />
        </MoleculesFormGroup>
      </AtomsPanel>
    </div>
  </div>
</template>

<style scoped lang="scss">
.settings-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-section-gap);
  padding-bottom: var(--space-layout-pad);
}

.description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-section-gap);
  max-width: 640px;
}
</style>
