<script setup lang="ts">
/**
 * DesignSystem
 * 社内用のUIカタログ（デザインシステム）画面のコンポーネントです。UIコンポーネントの見た目や状態を一覧で確認できます。
 */
import { ref } from 'vue';

const inputText = ref('');
const isToggled = ref(false);
const isChecked = ref(false);
</script>

<template>
  <div class="p-design-system">
    <div class="p-design-system__header">
      <AppSectionHeader title="Design System (UI Catalog)" icon="layout" variant="main" />
      <p class="p-design-system__desc">
        このページは社内用のUIカタログです。コンポーネントのデザインと状態を一覧で確認できます。
      </p>
    </div>

    <div class="p-design-system__content">
      <!-- Buttons -->
      <section class="p-ds-section">
        <h2 class="p-ds-section__title">Buttons (AppButton)</h2>
        <div class="p-ds-section__grid">
          <AppCard>
            <h3 class="p-ds-card-title">Variants</h3>
            <div class="p-ds-flex">
              <AppButton>Primary</AppButton>
              <AppButtonSecondary>Secondary</AppButtonSecondary>
              <AppButtonSuccess>Success</AppButtonSuccess>
              <AppButtonDanger>Danger</AppButtonDanger>
            </div>
          </AppCard>

          <AppCard>
            <h3 class="p-ds-card-title">Sizes & States</h3>
            <div class="p-ds-flex">
              <AppButton size="sm">Small</AppButton>
              <AppButton size="md">Medium</AppButton>
              <AppButton disabled>Disabled</AppButton>
            </div>
          </AppCard>
        </div>
      </section>

      <!-- Forms -->
      <section class="p-ds-section">
        <h2 class="p-ds-section__title">Forms (AppInput / AppToggle / AppCheckbox)</h2>
        <div class="p-ds-section__grid">
          <AppCard>
            <h3 class="p-ds-card-title">Text Inputs</h3>
            <div class="p-ds-stack">
              <AppInput v-model="inputText" placeholder="Standard Input" />
              <AppInput placeholder="Disabled Input" disabled />
            </div>
          </AppCard>

          <AppCard>
            <h3 class="p-ds-card-title">Toggles & Checkboxes</h3>
            <div class="p-ds-flex">
              <AppToggle v-model="isToggled" label="Toggle Switch" />
              <AppCheckbox v-model="isChecked" label="Checkbox" />
            </div>
          </AppCard>
        </div>
      </section>

      <!-- Feedback -->
      <section class="p-ds-section">
        <h2 class="p-ds-section__title">Feedback (AppBadge)</h2>
        <div class="p-ds-section__grid">
          <AppCard>
            <h3 class="p-ds-card-title">Badges</h3>
            <div class="p-ds-flex">
              <!-- Assuming these variants exist based on common patterns -->
              <AppBadge variant="primary">Primary</AppBadge>
              <AppBadge variant="neutral">Neutral</AppBadge>
              <AppBadge variant="success">Success</AppBadge>
              <AppBadge variant="warning">Warning</AppBadge>
              <AppBadge variant="danger">Danger</AppBadge>
            </div>
          </AppCard>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.p-design-system {
  // --- レイアウト・配置 ---
  @include flex-column(var(--gap-section));


  // --- ボックスモデル ---

  padding-bottom: var(--gap-section);


  // --- 子要素 ---

  &__desc {
    // --- ボックスモデル ---
    margin-top: var(--pad-container);

    // --- タイポグラフィ ---
    color: var(--color-text-muted);
  }

  &__content {
    // --- レイアウト・配置 ---
    @include flex-column(var(--gap-section));
  }
}

.p-ds-section {
  // --- レイアウト・配置 ---
  @include flex-column(var(--gap-component));


  // --- 子要素 ---

  &__title {
    // --- 継承 ---
    @extend %text-lg;


    // --- ボックスモデル ---

    padding-bottom: var(--pad-component);
    border-bottom: 1px solid var(--color-border);

    // --- タイポグラフィ ---
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }

  &__grid {
    // --- レイアウト・配置 ---
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: var(--gap-component);
  }
}

.p-ds-card-title {
  // --- 継承 ---
  @extend %text-base;


  // --- ボックスモデル ---

  margin-bottom: var(--pad-container);

  // --- タイポグラフィ ---
  font-weight: var(--font-weight-bold);
  color: var(--color-text-sub);
}

.p-ds-flex {
  // --- レイアウト・配置 ---
  display: flex;
  flex-wrap: wrap;
  gap: var(--pad-container);
  align-items: center;
}

.p-ds-stack {
  // --- レイアウト・配置 ---
  @include flex-column(var(--pad-container));
}
</style>
