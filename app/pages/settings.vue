<script setup lang="ts">
/**
 * Settings
 * UIや個人の設定を行う画面のコンポーネントです。テーマや背景エフェクトなどのカスタマイズ機能を提供します。
 */
import { useSettings } from "~/composables/useSettings";

useHead({
  title: "UI・個人設定",
});

const { themeMode } = useSettings();

const themeOptions = [
  { label: "ダークモード (標準)", value: "dark" },
  { label: "ライトモード", value: "light" },
];
</script>

<template>
  <div class="p-settings">
    <AppSectionHeader
      title="UI・個人設定"
      icon="settings"
      variant="tool"
      size="lg"
    >
      <template #description>
        このブラウザ固有のUI設定をカスタマイズします。
      </template>
    </AppSectionHeader>

    <div class="p-settings__grid">
      <div class="p-settings__stack">
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
              <AppSelect
                v-model="themeMode"
                :options="themeOptions"
              />
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
  container-type: inline-size;

  @include flex-column(var(--space-section-gap));

  padding-bottom: var(--space-layout-pad);

  &__panel-content {
    @include flex-column(var(--space-card-gap));
  }

  &__grid {
    @include grid(1fr, var(--space-section-gap));

    @include cq("md") {
      grid-template-columns: 2fr 1fr;
    }
  }

  &__stack {
    @include flex-column(var(--space-stack-gap));
  }
}
</style>
