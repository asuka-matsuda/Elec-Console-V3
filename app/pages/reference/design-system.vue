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
    <AppSectionHeader
      title="Design System (UI Catalog)"
      icon="layout"
      variant="main"
    >
      <template #description>
        このページは社内用のUIカタログです。コンポーネントのデザインと状態を一覧で確認できます。
      </template>
    </AppSectionHeader>

    <div class="p-design-system__content">
      <!-- Buttons -->
      <section class="p-ds-section">
        <AppSectionHeader
          title="Buttons (AppButton)"
          size="md"
        />
        <div class="p-ds-section__grid">
          <AppCard>
            <h3 class="p-ds-card-title">
              Variants
            </h3>
            <div class="p-ds-flex">
              <AppButton>Primary</AppButton>
              <AppButton variant="secondary">
                Secondary
              </AppButton>
              <AppButton variant="success">
                Success
              </AppButton>
              <AppButton variant="danger">
                Danger
              </AppButton>
            </div>
          </AppCard>

          <AppCard>
            <h3 class="p-ds-card-title">
              Sizes & States
            </h3>
            <div class="p-ds-flex">
              <AppButton size="sm">
                Small
              </AppButton>
              <AppButton size="md">
                Medium
              </AppButton>
              <AppButton disabled>
                Disabled
              </AppButton>
            </div>
          </AppCard>
        </div>
      </section>

      <!-- Forms -->
      <section class="p-ds-section">
        <AppSectionHeader
          title="Forms (AppInput / AppToggle / AppCheckbox)"
          size="md"
        />
        <div class="p-ds-section__grid">
          <AppCard>
            <h3 class="p-ds-card-title">
              Text Inputs
            </h3>
            <div class="p-ds-stack">
              <AppInput
                v-model="inputText"
                placeholder="Standard Input"
              />
              <AppInput
                placeholder="Disabled Input"
                disabled
              />
            </div>
          </AppCard>

          <AppCard>
            <h3 class="p-ds-card-title">
              Toggles & Checkboxes
            </h3>
            <div class="p-ds-flex">
              <AppToggle
                v-model="isToggled"
                label="Toggle Switch"
              />
              <AppCheckbox
                v-model="isChecked"
                label="Checkbox"
              />
            </div>
          </AppCard>
        </div>
      </section>

      <!-- Feedback -->
      <section class="p-ds-section">
        <AppSectionHeader
          title="Feedback (AppBadge)"
          size="md"
        />
        <div class="p-ds-section__grid">
          <AppCard>
            <h3 class="p-ds-card-title">
              Badges
            </h3>
            <div class="p-ds-flex">
              <!-- Assuming these variants exist based on common patterns -->
              <AppBadge color="primary">
                Primary
              </AppBadge>
              <AppBadge color="secondary">
                Secondary
              </AppBadge>
              <AppBadge color="success">
                Success
              </AppBadge>
              <AppBadge color="warning">
                Warning
              </AppBadge>
              <AppBadge color="danger">
                Danger
              </AppBadge>
            </div>
          </AppCard>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.p-design-system {
  @include flex-column(var(--space-section-gap));

  padding-bottom: var(--space-layout-pad);

  &__content {
    @include flex-column(var(--space-section-gap));
  }
}

.p-ds-section {
  @include flex-column;

  &__grid {
    @include grid-auto(350px, var(--space-card-gap));
  }
}

.p-ds-card-title {
  @include text-body;

  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
}

.p-ds-flex {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-card-gap);
  align-items: center;
}

.p-ds-stack {
  @include flex-column(var(--space-stack-gap));
}
</style>
