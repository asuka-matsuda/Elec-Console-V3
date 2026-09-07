<script setup lang="ts">
/**
 * AppFormGroup
 * フォームのラベル、入力項目、エラーメッセージ、ヘルプテキストをグループ化して表示するコンポーネントです。
 */
interface Props {
  label?: string
  required?: boolean
  requiredLabel?: string
  error?: string
  help?: string
  layout?: 'vertical' | 'horizontal'
}

const {
  label,
  required = false,
  requiredLabel = 'REQUIRED',
  error,
  help,
  layout = 'vertical',
} = defineProps<Props>()
</script>

<template>
  <div class="form-group" :class="`is-${layout}`">
    <label v-if="label || $slots.label" class="label">
      <span class="label-text">
        <slot name="label">{{ label }}</slot>
      </span>
      <AppBadge
        v-if="required"
        color="var(--color-status-danger)"
      >
        {{ requiredLabel }}
      </AppBadge>
    </label>

    <div class="control">
      <slot />

      <transition name="fade-slide">
        <div v-if="error" class="error">
          {{ error }}
        </div>
      </transition>

      <div v-if="help && !error" class="help">
        {{ help }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.form-group {
  display: flex;
  flex-direction: column;
  width: 100%;

  &.is-horizontal {
    flex-direction: row;
    gap: var(--space-form-col-gap);
    align-items: flex-start;
  }

  &:focus-within .label-text {
    color: var(--theme-accent);

    &::before {
      --glow-color: var(--theme-accent);

      transform: scaleY(1.2);
      box-shadow: var(--shadow-glow-sm);
    }
  }

  &:has(.error, .is-error) .label-text {
    color: var(--color-status-danger);

    &::before {
      --glow-color: var(--color-status-danger);

      background-color: var(--color-status-danger);
      box-shadow: var(--shadow-glow-sm);
    }
  }
}

.label {
  cursor: pointer;
  user-select: none;

  display: flex;
  gap: var(--space-2);
  align-items: center;

  width: 100%;
  margin-bottom: var(--space-2);

  .is-horizontal & {
    flex-shrink: 0;
    width: 140px;
    margin-bottom: 0;
    padding-top: calc(
      (
          (var(--font-size-sm) * var(--control-height-ratio)) -
            (var(--line-height-tight) * var(--font-size-base))
        ) / 2
    );
  }
}

.label-text {
  display: inline-flex;
  gap: var(--space-1);
  align-items: center;

  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text-main);
  letter-spacing: var(--tracking-wide);

  transition: var(--transition-base);

  &::before {
    content: "";

    flex-shrink: 0;

    width: var(--space-0-5);
    height: var(--font-size-xs);
    border-radius: var(--radius-sm);

    background-color: var(--theme-accent);

    transition:
      transform var(--transition-fast),
      background-color var(--transition-fast),
      box-shadow var(--transition-fast);
  }
}

.control {
  position: relative;

  display: flex;
  flex-direction: column;
  gap: var(--space-1);

  width: 100%;

  .is-horizontal & {
    flex: 1;
    min-width: 0;
  }
}

.error {
  --glow-color: var(--color-status-danger);

  font-size: var(--font-size-2xs);
  color: var(--color-status-danger);
  text-shadow: var(--text-glow-sm);
  letter-spacing: var(--tracking-wide);
}

.help {
  font-size: var(--font-size-2xs);
  color: var(--color-text-muted);
  letter-spacing: var(--tracking-wide);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity var(--duration-fast) var(--ease-base),
    transform var(--duration-fast) var(--ease-base);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  transform: translateY(-4px);
  opacity: 0;
}
</style>
