<script setup lang="ts">
import { computed } from 'vue'

import type { NuxtError } from '#app'
import { clearError, useHead } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const statusCode = computed(() => props.error?.statusCode || 500)
const isNotFound = computed(() => statusCode.value === 404)

useHead({
  title: `${statusCode.value} - Elec-Console`,
})

const handleReset = () => {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="p-error-page">
    <div class="p-error-page__card">
      <div class="p-error-page__header">
        <AppLogo />
      </div>

      <div class="p-error-page__badge">
        <AppIcon
          :name="isNotFound ? 'compass' : 'alert-triangle'"
          size="lg"
          :class="isNotFound ? 'u-text-primary' : 'u-text-danger'"
        />
        <span class="p-error-page__code">{{ statusCode }}</span>
      </div>

      <h1 class="p-error-page__title">
        {{ isNotFound ? "指定されたページが見つかりません" : "システムエラーが発生しました" }}
      </h1>

      <p class="p-error-page__desc">
        {{
          isNotFound
            ? "アクセスしようとしたページは削除されたか、URLが変更された可能性があります。"
            : "予期せぬエラーが発生しました。しばらく待ってから再度お試しいただくか、ホームへお戻りください。"
        }}
      </p>

      <div class="p-error-page__actions">
        <AppButton
          variant="primary"
          icon="home"
          size="md"
          @click="handleReset"
        >
          ホームへ戻る
        </AppButton>
      </div>

      <details
        v-if="error?.message && !isNotFound"
        class="p-error-page__details"
      >
        <summary class="p-error-page__summary">
          <AppIcon name="chevron-right" size="sm" />
          <span>詳細なエラー情報</span>
        </summary>
        <pre class="p-error-page__stack">{{ error.message }}</pre>
      </details>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.p-error-page {
  display: flex;
  align-items: center;
  justify-content: center;

  min-height: 100vh;
  padding: var(--space-4);

  background-color: var(--color-bg-base);
  background-image:
    radial-gradient(
      circle at 50% 20%,
      color-mix(in srgb, var(--color-category-main, #3b82f6) 12%, transparent),
      transparent 70%
    );

  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;

    width: 100%;
    max-width: 520px;
    padding: var(--space-6) var(--space-5);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);

    text-align: center;

    background-color: var(--color-bg-surface-elevated);
    box-shadow: var(--shadow-lg);
  }

  &__header {
    margin-bottom: var(--space-5);
  }

  &__badge {
    display: inline-flex;
    gap: var(--space-2);
    align-items: center;

    margin-bottom: var(--space-3);
    padding: var(--space-1) var(--space-3);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-full);

    background-color: var(--color-bg-surface);
  }

  &__code {
    font-family: var(--font-mono);
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--color-text-main);
  }

  &__title {
    margin: 0 0 var(--space-2);
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--color-text-main);
  }

  &__desc {
    margin: 0 0 var(--space-5);
    font-size: var(--font-size-sm);
    line-height: 1.6;
    color: var(--color-text-muted);
  }

  &__actions {
    display: flex;
    gap: var(--space-3);
    justify-content: center;
  }

  &__details {
    width: 100%;
    margin-top: var(--space-5);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);

    text-align: left;

    background-color: var(--color-bg-surface);
  }

  &__summary {
    cursor: pointer;
    user-select: none;

    display: flex;
    gap: var(--space-2);
    align-items: center;

    padding: var(--space-2) var(--space-3);

    font-size: var(--font-size-xs);
    font-weight: 500;
    color: var(--color-text-muted);

    &:hover {
      color: var(--color-text-main);
    }
  }

  &__stack {
    overflow-x: auto;

    margin: 0;
    padding: var(--space-3);
    border-top: 1px dashed var(--color-border-subtle);

    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    color: var(--color-status-danger);
  }
}
</style>
