<script setup lang="ts">
/**
 * Settings
 * UIや個人の設定を行う画面のコンポーネントです。テーマや背景エフェクトなどのカスタマイズ機能を提供します。
 */
import { useSettings } from "~/composables/useSettings";

const { themeMode } = useSettings();

const themeOptions = [
  { label: "ダークモード (標準)", value: "dark" },
  { label: "ライトモード", value: "light" },
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
  // --- Base Styles ---
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  gap: var(--gap-section);

  padding-bottom: var(--gap-section);

  &__header {
    @include flex-column(var(--gap-element));
  }

  &__panel-content {
    @include flex-column(var(--gap-section));
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr; // スモールファースト
    gap: var(--gap-section);

    @include cq("md") {
      grid-template-columns: 2fr 1fr;
    }
  }

  &__stack {
    @include flex-column(var(--gap-section));
  }

  &__sub-group {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gap-component);

    padding: var(--pad-container);
    border: var(--border-width-base) solid var(--color-border);
    border-radius: 0;
  }

  &__desc {
    @extend %text-sm;

    color: var(--color-text-muted);
  }
}
</style>
