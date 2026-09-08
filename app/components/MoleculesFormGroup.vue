<script setup lang="ts">
/**
 * MoleculesFormGroup
 * [Molecules] フォームのラベル、入力項目、エラーメッセージ、ヘルプテキストをグループ化して表示するコンポーネント。
 */
interface Props {
  label?: string
  required?: boolean
  requiredLabel?: string
  error?: string
  help?: string
  layout?: 'vertical' | 'horizontal'
  forId?: string
}

withDefaults(defineProps<Props>(), {
  required: false,
  requiredLabel: 'REQUIRED',
  layout: 'vertical',
})
</script>

<template>
  <div
    class="flex flex-col gap-2 w-full form-group"
    :class="`is-${layout}`"
  >
    <!-- ラベル領域 -->
    <label
      v-if="label || $slots.label"
      :for="forId"
      class="flex items-center gap-2 w-full select-none cursor-pointer label"
    >
      <span class="inline-flex items-center gap-1 label-text">
        <slot name="label">{{ label }}</slot>
      </span>
      <AtomsBadge
        v-if="required"
        color="var(--color-status-danger)"
      >
        {{ requiredLabel }}
      </AtomsBadge>
    </label>

    <!-- コントロール領域 -->
    <div class="relative flex flex-col gap-1 w-full control">
      <slot />

      <!-- エラーメッセージ -->
      <transition name="fade-slide">
        <p v-if="error || $slots.error" class="m-0 error" role="alert">
          <slot name="error">{{ error }}</slot>
        </p>
      </transition>

      <!-- ヘルプテキスト -->
      <p v-if="help && !error" class="m-0 help">
        <slot name="help">{{ help }}</slot>
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.form-group {
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
  .is-horizontal & {
    flex-shrink: 0;
    width: 140px;
    padding-top: calc(
      (
          (var(--font-size-sm) * var(--control-height-ratio)) -
            (var(--line-height-tight) * var(--font-size-base))
        ) / 2
    );
  }
}

.label-text {
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
  font-size: var(--font-size-sm);

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
