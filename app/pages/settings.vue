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

const { themeMode, animationEnabled } = useSettings()
</script>

<template>
  <div class="flex flex-col gap-section-gap pb-layout-pad">
    <MoleculesSectionHeader
      title="UI・個人設定"
      icon="settings"
      size="lg"
    />
    <p class="description m-0">
      このブラウザ固有のUI設定をカスタマイズします。
    </p>

    <div class="flex flex-col gap-section-gap max-w-[640px]">
      <Panel as="section" class="flex flex-col gap-4">
        <MoleculesSectionHeader
          title="テーマ・カラー設定"
          icon="moon"
          size="md"
        />

        <p class="description m-0">
          画面のテーマ（ライト/ダーク）を変更します。
        </p>

        <MoleculesFormGroup
          label="外観モード"
          help="全体の明るさを変更します（ダークモード推奨）"
        >
          <AtomsSelect v-model="themeMode" :options="THEME_OPTIONS" />
        </MoleculesFormGroup>
      </Panel>

      <Panel as="section" class="flex flex-col gap-4">
        <MoleculesSectionHeader
          title="演出・アニメーション設定"
          icon="zap"
          size="md"
        />

        <p class="description m-0">
          区切り線のサイバーパルス光やスケール演出などのアニメーション効果を設定します。
        </p>

        <MoleculesFormGroup
          label="アニメーション演出"
          help="OFFにすると、パルス光やスケール演出を停止し、落ち着いた静止表示にします"
        >
          <Checkbox
            v-model="animationEnabled"
            label="サイバーパルス・モーション演出を有効にする"
          />
        </MoleculesFormGroup>
      </Panel>
    </div>
  </div>
</template>

<style scoped lang="scss">
.description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
</style>
