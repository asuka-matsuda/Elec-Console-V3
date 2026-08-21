<script setup lang="ts">
import { useSettings } from "~/composables/useSettings";

const {
  themeMode,
  baseBgStyle,
  solidColor,
  gradientColor1,
  gradientColor2,
  auroraColor1,
  auroraColor2,
  auroraColor3,
  auroraColor4,
  gridColor,
  gridSpacing,
} = useSettings();

const themeOptions = [
  { label: "ダークモード (標準)", value: "dark" },
  { label: "ライトモード", value: "light" },
];

const bgOptions = [
  { label: "単色", value: "solid" },
  { label: "グラデーション", value: "gradient" },
  { label: "オーロラ", value: "aurora" },
  { label: "サイバーグリッド", value: "grid" },
];
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
      <p class="p-settings__desc">
        このブラウザ固有のUI設定をカスタマイズします。
      </p>
    </header>

    <div class="p-settings__grid">
      <div class="p-settings__stack">
        <!-- エフェクト設定 -->
        <AppPanel title="エフェクト設定" variant="hybrid" bracket-color="tool">
          <template #header>
            <AppSectionHeader
              title="エフェクト設定"
              icon="monitor"
              variant="tool"
              size="md"
            />
          </template>

          <div class="p-settings__panel-content">
            <p class="p-settings__desc">
              画面の演出効果を切り替えることができます。動作が重い場合はシンプルなものに変更してください。
            </p>

            <AppFormGroup label="ベース背景スタイル">
              <AppSelect v-model="baseBgStyle" :options="bgOptions" />
            </AppFormGroup>

            <!-- Solid Settings -->
            <div v-if="baseBgStyle === 'solid'" class="p-settings__sub-group">
              <AppColorPicker v-model="solidColor" label="背景色" />
            </div>

            <!-- Gradient Settings -->
            <div v-if="baseBgStyle === 'gradient'" class="p-settings__sub-group">
              <AppColorPicker v-model="gradientColor1" label="開始色" />
              <AppColorPicker v-model="gradientColor2" label="終了色" />
            </div>

            <!-- Aurora Settings -->
            <div v-if="baseBgStyle === 'aurora'" class="p-settings__sub-group">
              <AppColorPicker v-model="auroraColor1" label="カラー 1" />
              <AppColorPicker v-model="auroraColor2" label="カラー 2" />
              <AppColorPicker v-model="auroraColor3" label="カラー 3" />
              <AppColorPicker v-model="auroraColor4" label="カラー 4" />
            </div>

            <!-- Grid Settings -->
            <div v-if="baseBgStyle === 'grid'" class="p-settings__sub-group">
              <AppFormGroup label="グリッド間隔 (px)">
                <AppInput v-model.number="gridSpacing" type="number" />
              </AppFormGroup>
              <AppColorPicker v-model="gridColor" label="グリッド線色" />
            </div>
          </div>
        </AppPanel>

        <!-- テーマ・カラー設定 -->
        <AppPanel
          title="テーマ・カラー設定"
          variant="hybrid"
          bracket-color="tool"
        >
          <template #header>
            <AppSectionHeader
              title="テーマ・カラー設定"
              icon="moon"
              variant="tool"
              size="md"
            />
          </template>

          <div class="p-settings__panel-content">
            <p class="p-settings__desc">
              画面のテーマ（ライト/ダーク）を変更します。
            </p>

            <AppFormGroup
              label="外観モード"
              help="全体の明るさを変更します（ダークモード推奨）"
            >
              <AppSelect v-model="themeMode" :options="themeOptions" />
            </AppFormGroup>
          </div>
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
  gap: var(--gap-section);
  padding-bottom: var(--gap-section);
  container-type: inline-size;

  &__header {
    display: flex;
    flex-direction: column;
    gap: var(--gap-element);
  }

  &__panel-content {
    display: flex;
    flex-direction: column;
    gap: var(--gap-section);
  }

  &__grid {
    display: grid;
    gap: var(--gap-section);
    grid-template-columns: 1fr; // スモールファースト

    @include cq("md") {
      grid-template-columns: 2fr 1fr;
    }
  }

  &__stack {
    display: flex;
    flex-direction: column;
    gap: var(--gap-section);
  }

  &__sub-group {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gap-component);
    padding: var(--pad-container);
    border-radius: 0;
    border: var(--border-width-base) solid var(--color-border);
  }

  &__desc {
    @extend %text-sm;

    color: var(--color-text-muted);
  }
}
</style>
