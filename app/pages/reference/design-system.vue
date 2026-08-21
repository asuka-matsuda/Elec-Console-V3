<script setup lang="ts">
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
              <AppButton _variant="primary">Primary</AppButton>
              <AppButton _variant="secondary">Secondary</AppButton>
              <AppButton _variant="success">Success</AppButton>
              <AppButton _variant="danger">Danger</AppButton>
            </div>
          </AppCard>

          <AppCard>
            <h3 class="p-ds-card-title">Sizes & States</h3>
            <div class="p-ds-flex">
              <AppButton size="sm">Small</AppButton>
              <AppButton size="md">Medium</AppButton>
              <AppButton size="lg">Large</AppButton>
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
  display: flex;
  flex-direction: column;
  gap: var(--gap-section);
  padding-bottom: var(--gap-section);

  &__desc {
    margin-top: var(--space-4);
    color: var(--color-text-muted);
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--gap-section);
  }
}

.p-ds-section {
  display: flex;
  flex-direction: column;
  gap: var(--gap-component);

  &__title {
    @extend %text-lg;

    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
    border-bottom: 1px solid var(--color-border);
    padding-bottom: var(--space-2);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: var(--gap-component);
  }
}

.p-ds-card-title {
  @extend %text-base;

  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-4);
  color: var(--color-text-sub);
}

.p-ds-flex {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-4);
}

.p-ds-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
</style>
